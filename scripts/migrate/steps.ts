import * as cheerio from 'cheerio'
import { z } from 'zod'
import {
  CategoryNode, MigratedDocument, MigratedPage, MigratedProduct, MigratedProject, MigratedReview, type FileRef,
} from '../../src/data/schema'
import { cleanHtml, plain } from './clean'
import { BASE, decode, download, get, progress, slugify, wp, wpAll } from './lib'

type Post = {
  id: number; slug: string; link: string; date: string; title: { rendered: string }; content: { rendered: string }
  categories?: number[]; product_cat?: number[]; featured_media: number
}
type Media = { id: number; source_url: string; mime_type: string; title: { rendered: string } }

export const issues: string[] = []
export const note = (m: string) => issues.push(m)
const F = '_fields=id,slug,link,date,title,content,categories,product_cat,featured_media'
const byDate = <T extends { date: string; slug: string }>(a: T[]) => [...a].sort((x, y) => y.date.localeCompare(x.date) || x.slug.localeCompare(y.slug))
const title = (p: Post) => decode(p.title.rendered)
const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9]+/g, '')

async function mediaMap(ids: number[]) {
  const m = new Map<number, Media>()
  const uniq = [...new Set(ids.filter(Boolean))].sort((a, b) => a - b)
  for (let i = 0; i < uniq.length; i += 100) {
    const list = await wp<Media[]>(`media?include=${uniq.slice(i, i + 100).join(',')}&per_page=100&_fields=id,source_url,mime_type,title`)
    for (const x of list) m.set(x.id, x)
  }
  return m
}

// ---------------- таксономия ----------------
export async function taxonomy() {
  const [cats, pcats] = await Promise.all([
    wpAll<{ id: number; slug: string; name: string; parent: number; count: number }>('categories?_fields=id,slug,name,parent,count'),
    wpAll<{ id: number; slug: string; name: string; parent: number; count: number }>('product_cat?_fields=id,slug,name,parent,count'),
  ])
  const nodes = [
    ...cats.map((c) => ({ id: c.id, slug: decodeURIComponent(c.slug), name: decode(c.name), parent: c.parent || null, kind: 'post' as const, count: c.count })),
    ...pcats.map((c) => ({ id: c.id, slug: decodeURIComponent(c.slug), name: decode(c.name), parent: c.parent || null, kind: 'product' as const, count: c.count })),
  ]
  const all = z.array(CategoryNode).parse(nodes)
  const descendants = (kind: 'post' | 'product', root: number) => {
    const out = new Set([root]); let grew = true
    while (grew) { grew = false; for (const c of all) if (c.kind === kind && c.parent && out.has(c.parent) && !out.has(c.id)) { out.add(c.id); grew = true } }
    return out
  }
  return { all, descendants }
}
type Tax = Awaited<ReturnType<typeof taxonomy>>

// ---------------- проекты ----------------
export async function projects(tax: Tax) {
  const posts = await wpAll<Post>(`posts?categories=26,94&${F}`)
  const media = await mediaMap(posts.map((p) => p.featured_media))
  const importIds = tax.descendants('post', 94)
  const groups = new Map<string, Post[]>()
  posts.forEach((p) => groups.set(norm(title(p)), [...(groups.get(norm(title(p))) ?? []), p]))
  const out: z.infer<typeof MigratedProject>[] = []
  let i = 0
  for (const group of groups.values()) {
    progress('Проекты', ++i, groups.size)
    const sorted = [...group].sort((a, b) => a.id - b.id)
    const t = title(sorted[0])
    const slug = slugify(t)
    const images: string[] = []; let html = ''; let text = ''
    for (const p of sorted) {
      const f = media.get(p.featured_media)
      if (f) { const r = await download(f.source_url, 'projects', `${slug}-cover`); if (r && !images.includes(r.path)) images.push(r.path) }
      const c = await cleanHtml(p.content.rendered, { bucket: 'projects', slug })
      c.images.forEach((x) => !images.includes(x) && images.push(x))
      if (c.text.length > text.length) { html = c.html; text = c.text }
    }
    const region = /,\s*([^,«»]{3,30})$/.exec(t)?.[1]?.trim() ?? null
    if (group.length > 1) note(`Проект «${t}» объединён из ${group.length} дублей (id ${sorted.map((p) => p.id).join(', ')})`)
    if (!images.length) note(`Проект «${t}»: нет изображений (${sorted[0].link})`)
    out.push({
      slug, title: t, region, importSubstitution: sorted.some((p) => p.categories?.some((c) => importIds.has(c))),
      date: sorted.map((p) => p.date).sort().at(-1)!, html, images,
      sourceUrls: sorted.map((p) => p.link), mergedFrom: sorted.map((p) => p.id),
    })
  }
  return z.array(MigratedProject).parse(byDate(out))
}

// ---------------- отзывы ----------------
export async function reviews(tax: Tax) {
  const industries = [97, 98, 99, 100]
  const posts = await wpAll<Post>(`posts?categories=22,${industries.join(',')}&${F}`)
  const media = await mediaMap(posts.map((p) => p.featured_media))
  const names = new Map(tax.all.filter((c) => c.kind === 'post').map((c) => [c.id, c.name]))
  const out: z.infer<typeof MigratedReview>[] = []
  const seen = new Set<number>()
  let i = 0
  for (const p of posts) {
    progress('Отзывы', ++i, posts.length)
    if (seen.has(p.id)) continue
    seen.add(p.id)
    const slug = `${slugify(title(p))}-${p.id}`
    const c = await cleanHtml(p.content.rendered, { bucket: 'reviews', slug })
    const f = media.get(p.featured_media)
    const cover = f ? (await download(f.source_url, 'reviews', slug))?.path ?? null : null
    const industry = p.categories?.map((x) => industries.includes(x) && names.get(x)).find(Boolean) || null
    if (!c.text && !cover) note(`Отзыв «${title(p)}»: нет ни текста, ни скана (${p.link})`)
    out.push({ id: p.id, slug, company: title(p), industry: industry || null, date: p.date, html: c.html, image: cover ?? c.images[0] ?? null, sourceUrl: p.link })
  }
  return z.array(MigratedReview).parse(byDate(out))
}

// ---------------- документы ----------------
const KIND_BY_CAT: [string, MigratedDocument['kind']][] = [
  ['deklaraczii', 'declaration'], ['deklaratsi', 'declaration'], ['sertifikaty', 'certificate'], ['svidetelstva', 'attestation'],
  ['politika', 'policy'], ['diplomy', 'diploma'], ['patenty', 'patent'],
]
function kindOf(t: string, slugs: string[]): MigratedDocument['kind'] {
  if (/^сертификат/i.test(t)) return 'certificate'
  if (/^декларац/i.test(t)) return 'declaration'
  if (/^(свидетельство|аттестат)/i.test(t)) return 'attestation'
  for (const [k, v] of KIND_BY_CAT) if (slugs.some((s) => s.includes(k))) return v
  if (/руководство|инструкци|паспорт/i.test(t)) return 'manual'
  if (/методик/i.test(t)) return 'method'
  if (/опросн/i.test(t)) return 'form'
  if (/каталог/i.test(t)) return 'catalog'
  return 'other'
}

export async function documents(tax: Tax) {
  const catIds = [...tax.descendants('post', 20)]
  const posts = await wpAll<Post>(`posts?categories=${catIds.join(',')}&${F}`)
  const pressure = new Set([297, 302, 301, 35, 40]); const temperature = new Set([296, 299, 300, 298, 31, 32, 53, 54, 55, 38])
  const slugOf = new Map(tax.all.filter((c) => c.kind === 'post').map((c) => [c.id, c.slug]))
  const fmedia = await mediaMap(posts.map((p) => p.featured_media))
  const out: z.infer<typeof MigratedDocument>[] = []
  let i = 0
  for (const p of posts) {
    progress('Документы', ++i, posts.length)
    const t = title(p)
    const slug = `${slugify(t)}-${p.id}`
    const att = await wp<Media[]>(`media?parent=${p.id}&per_page=100&_fields=id,source_url,mime_type,title`)
    const c = await cleanHtml(p.content.rendered, { bucket: 'documents', slug })
    const featured = fmedia.get(p.featured_media)
    let file: FileRef | null = null
    const docAtt = att.find((m) => !m.mime_type.startsWith('image/') && !m.mime_type.startsWith('text/'))
    if (docAtt) {
      const r = await download(docAtt.source_url, 'documents', slug)
      if (r) file = { title: t, url: r.path as FileRef['url'], format: r.path.split('.').pop()!.toUpperCase(), sizeKb: r.sizeKb }
    }
    if (!file && c.files[0]) file = { ...c.files[0], title: t }
    if (!file && (featured || c.images[0])) {
      const r = featured ? await download(featured.source_url, 'documents', slug) : { path: c.images[0], sizeKb: 1 }
      if (r) file = { title: t, url: r.path as FileRef['url'], format: 'WEBP', sizeKb: r.sizeKb }
    }
    if (!file) { note(`Документ «${t}»: файл не найден (${p.link})`); continue }
    const cats = p.categories ?? []
    const preview = featured && file.format !== 'WEBP' ? (await download(featured.source_url, 'documents', `${slug}-preview`))?.path ?? null : null
    out.push({
      id: p.id, slug, title: t, kind: kindOf(t, cats.map((c) => slugOf.get(c) ?? '')),
      scope: cats.some((c) => pressure.has(c)) ? 'pressure' : cats.some((c) => temperature.has(c)) ? 'temperature' : 'general',
      categorySlugs: cats.map((c) => slugOf.get(c) ?? '').filter(Boolean), date: p.date, file, preview, sourceUrl: p.link,
    })
  }
  // PDF-каталоги со страниц «Скачать каталог» (скачиваем, не читаем)
  for (const pid of [6427, 6027, 6030]) {
    const pg = await wp<Post>(`pages/${pid}?_fields=id,slug,link,date,title,content,featured_media`)
    const $ = cheerio.load(pg.content.rendered)
    for (const a of $('a[href$=".pdf"]').toArray()) {
      const href = $(a).attr('href')!
      if (out.some((d) => d.sourceUrl === href)) continue
      const name = href.split('/').pop()!.replace(/\.pdf$/i, '')
      const r = await download(href, 'documents', `catalog-${name}`)
      if (!r) { note(`Каталог ${href}: не скачан`); continue }
      const id = 1_000_000 + out.length
      out.push({
        id, slug: slugify(name), title: decode($(a).text()) || `Каталог ${name}`, kind: 'catalog',
        scope: /davlen|vmp/i.test(name) ? 'pressure' : 'general', categorySlugs: ['dokumenty-kataloga'], date: pg.date,
        file: { title: name, url: r.path as FileRef['url'], format: 'PDF', sizeKb: r.sizeKb }, preview: null, sourceUrl: href,
      })
    }
  }
  const uniq = [...new Map(out.map((d) => [d.file.url, d])).values()]
  if (uniq.length !== out.length) note(`Документы: убрано ${out.length - uniq.length} дублей по файлу`)
  return z.array(MigratedDocument).parse(byDate(uniq))
}

// ---------------- товары ----------------
const PRODUCT_ROOTS = [67, 64, 71, 72, 74, 269, 82, 291, 292, 290]

export async function products(tax: Tax) {
  const roots = new Map(PRODUCT_ROOTS.map((r) => [r, tax.descendants('product', r)]))
  const all = await wpAll<Post>(`product?${F}`)
  const slugOf = new Map(tax.all.filter((c) => c.kind === 'product').map((c) => [c.id, c.slug]))
  const nameOf = new Map(tax.all.filter((c) => c.kind === 'product').map((c) => [c.id, c.name]))
  const scoped: { p: Post; root: number }[] = []
  const skipped = new Map<string, number>()
  for (const p of all) {
    const root = PRODUCT_ROOTS.find((r) => p.product_cat?.some((c) => roots.get(r)!.has(c)))
    if (root) scoped.push({ p, root })
    else {
      const key = (p.product_cat ?? []).map((c) => nameOf.get(c) ?? c).join(', ') || 'без рубрики'
      skipped.set(key, (skipped.get(key) ?? 0) + 1)
      if (p.product_cat?.includes(15)) note(`Товар «${title(p)}» без рубрики («Uncategorized»), не сопоставлен с каталогом: ${p.link}`)
    }
  }
  for (const [k, n] of skipped) if (!k.includes('Uncategorized')) note(`Вне перечня категорий (не перенесено): ${k} — ${n} шт.`)
  const media = await mediaMap(scoped.map((s) => s.p.featured_media))
  const out: z.infer<typeof MigratedProduct>[] = []
  let i = 0
  for (const { p, root } of scoped) {
    progress('Товары', ++i, scoped.length)
    const t = title(p)
    const slug = p.slug
    const c = await cleanHtml(p.content.rendered, { bucket: 'products', slug })
    const images = [...c.images]
    const f = media.get(p.featured_media)
    if (f) { const r = await download(f.source_url, 'products', `${slug}-cover`); if (r && !images.includes(r.path)) images.unshift(r.path) }
    const page = await get(p.link)
    const attributes: { name: string; values: string[] }[] = []
    let sku: string | null = null; let price: number | null = null
    if (page) {
      const $ = cheerio.load(page)
      $('.woocommerce-product-attributes-item').each((_, e) => {
        const name = decode($(e).find('.woocommerce-product-attributes-item__label').text())
        const value = decode($(e).find('.woocommerce-product-attributes-item__value').text())
        if (name && value) attributes.push({ name, values: value.split(/\s*,\s+/).filter(Boolean) })
      })
      sku = decode($('.product_meta .sku, .sku').first().text()) || null
      const pr = decode($('.summary .price, p.price').first().text()).replace(/[^\d,]/g, '').replace(',', '.')
      price = pr ? Number(pr) : null
    } else note(`Товар «${t}»: страница недоступна, атрибуты не получены (${p.link})`)
    if (!attributes.length) note(`Товар «${t}»: нет атрибутов (${p.link})`)
    const first = c.text.split(/(?<=[.!?])\s/)[0] ?? ''
    out.push({
      wpId: p.id, slug, name: t, sku, categoryIds: p.product_cat ?? [], rootCategory: slugOf.get(root)!,
      html: c.html, summary: (first.length > 220 ? first.slice(0, 217).replace(/\s\S*$/, '') + '…' : first) || t,
      images, attributes, documents: c.files, price, sourceUrl: p.link,
    })
  }
  return z.array(MigratedProduct).parse(out.sort((a, b) => a.rootCategory.localeCompare(b.rootCategory) || a.name.localeCompare(b.name, 'ru')))
}

// ---------------- страницы, поддержка, вакансии, пресс-центр ----------------
export async function pages(tax: Tax) {
  const out: z.infer<typeof MigratedPage>[] = []
  const add = async (p: Post, group: z.infer<typeof MigratedPage>['group']) => {
    const slug = decodeURIComponent(p.slug)
    const c = await cleanHtml(p.content.rendered, { bucket: group === 'press' ? 'press' : 'pages', slug })
    out.push({ slug: group === 'page' ? slug : `${slug}-${p.id}`, title: title(p), group, date: p.date, html: c.html, images: c.images, sourceUrl: p.link })
  }
  for (const id of [24, 26, 33, 30, 28, 8308, 8220]) {
    const pg = await wp<Post>(`pages/${id}?_fields=id,slug,link,date,title,content,featured_media`)
    await add(pg, 'page')
  }
  const groups: [string, z.infer<typeof MigratedPage>['group']][] = [['33', 'support'], ['294', 'vacancy'], ['29,30,48', 'press']]
  void tax
  for (const [cats, group] of groups) {
    const posts = await wpAll<Post>(`posts?categories=${cats}&${F}`)
    let i = 0
    for (const p of posts) { progress(`Страницы:${group}`, ++i, posts.length); await add(p, group) }
  }
  const dedup = [...new Map(out.map((p) => [p.slug, p])).values()]
  return z.array(MigratedPage).parse(byDate(dedup))
}

export { BASE, plain }
