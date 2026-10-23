import * as cheerio from 'cheerio'
import type { FileRef } from '../../src/data/schema'
import { absolute, decode, download, isOwn, isUpload, slugify } from './lib'

const DOC_EXT = /\.(pdf|docx?|xlsx?|zip|rar)$/i
const IMG_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i
const KEEP: Record<string, string[]> = { a: ['href'], img: ['src', 'alt'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'] }
const UNWRAP = 'span, font, center, section, article, small, big'
const BLOCKS = 'p, ul, ol, table, h1, h2, h3, h4, h5, h6, div, blockquote, pre'

export type Cleaned = { html: string; images: string[]; files: FileRef[]; text: string }

export const plain = (html: string) => decode(html.replace(/<[^>]+>/g, ' '))

/** Чистит WordPress-разметку: шорткоды, слайдеры, inline-стили, ссылки на старый домен. Картинки и документы скачиваются. */
export async function cleanHtml(raw: string, opts: { bucket: string; slug: string }): Promise<Cleaned> {
  const src = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[\/?(?:vc_|et_pb_|contact-form|caption|gallery|masterslider|metaslider|rev_slider)[^\]]*\]/gi, '')
  const $ = cheerio.load(src, null, false)
  const images: string[] = []
  const files: FileRef[] = []
  let n = 0

  // картинки из слайдера (MasterSlider): ленивые, в data-src
  const slider = $('.master-slider-parent img[data-src]').map((_, e) => $(e).attr('data-src') ?? '').get()
  $('.master-slider-parent, script, style, noscript, iframe, form, object, embed, link, meta').remove()
  for (const s of slider) {
    const r = await download(s, opts.bucket, `${opts.slug}-${++n}`)
    if (r && !images.includes(r.path)) images.push(r.path)
  }

  for (const el of $('img').toArray()) {
    const $el = $(el)
    const s = $el.attr('data-src') || $el.attr('data-lazy-src') || $el.attr('src') || ''
    if (!s || /blank\.gif|^data:/.test(s) || (!isOwn(s) && !/^https?:/.test(s))) { $el.remove(); continue }
    const r = isOwn(s) ? await download(s, opts.bucket, `${opts.slug}-${++n}`) : null
    if (!r) { $el.remove(); continue }
    if (!images.includes(r.path)) images.push(r.path)
    const alt = ($el.attr('alt') ?? '').trim()
    $el.attr('src', r.path).attr('alt', /\.(jpe?g|png|webp)$/i.test(alt) || /^[\w-]+$/.test(alt) ? '' : alt)
  }

  for (const el of $('a').toArray()) {
    const $a = $(el)
    const href = ($a.attr('href') ?? '').trim()
    if (!href || href.startsWith('#')) { $a.replaceWith($a.contents()); continue }
    if (/^(mailto|tel):/i.test(href)) continue
    const path = href.split(/[?#]/)[0]
    if (isOwn(href) && isUpload(href) && DOC_EXT.test(path)) {
      const r = await download(href, 'documents')
      if (r) {
        const title = decode($a.text()) || slugify(path.split('/').pop() ?? 'file')
        files.push({ title, url: r.path as FileRef['url'], format: path.split('.').pop()!.toUpperCase(), sizeKb: r.sizeKb })
        $a.attr('href', r.path)
        continue
      }
    }
    if (isOwn(href) || (isUpload(absolute(href)) && IMG_EXT.test(path))) { $a.replaceWith($a.contents()); continue }
    if (!/^https?:/i.test(href)) { $a.replaceWith($a.contents()); continue }
  }

  $('video, audio, h1').remove()
  // div: «строчные» превращаем в абзацы, контейнеры раскрываем (иначе соседние блоки склеиваются)
  $('div').toArray().reverse().forEach((d) => {
    const $d = $(d)
    if ($d.find(BLOCKS).length) $d.replaceWith($d.contents())
    else d.tagName = 'p'
  })
  $('b').each((_, e) => { e.tagName = 'strong' })
  $('i').each((_, e) => { e.tagName = 'em' })
  for (let i = 0; i < 3; i++) $(UNWRAP).each((_, e) => { $(e).replaceWith($(e).contents()) })
  $('*').each((_, e) => {
    if (e.type !== 'tag') return
    const keep = KEEP[e.tagName] ?? []
    for (const a of Object.keys(e.attribs)) if (!keep.includes(a)) $(e).removeAttr(a)
  })
  // пустые блоки (в том числе с &nbsp;), несколько проходов — вложенность
  for (let i = 0; i < 4; i++)
    $('p, li, ul, ol, h1, h2, h3, h4, h5, h6, td, th, tr, tbody, table, strong, em, sup, sub, a').each((_, e) => {
      const $e = $(e)
      if ($e.find('img').length || e.tagName === 'img') return
      if ($e.text().replace(/[\s\u00a0]+/g, '') === '') $e.remove()
    })
  $('br + br').remove()
  // таблицы-«раскладка» (картинка + текст в одной строке) превращаем в обычный поток
  $('table').each((_, t) => {
    const $t = $(t)
    const cells = $t.find('> tbody > tr > td, > tr > td')
    if ($t.find('tr').length === 1 && cells.length <= 2 && $t.find('table').length === 0 && $t.find('img').length) $t.replaceWith(cells.map((_, c) => $(c).contents().toArray()).get())
  })

  const html = ($.html() ?? '').replace(/&nbsp;|\u00a0/g, ' ').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').replace(/<br>\s*(<\/p>)/g, '$1').trim()
  return { html, images, files, text: plain(html) }
}
