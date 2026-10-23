import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import type { FamilyContent } from '../../src/data/structure-schema'
import { clean } from './common'

const MARK = {
  apps: /^(Область применения|Назначение)(?![А-Яа-яё])/i,
  features: /^(Конструктивные особенности|Особенности)(?![А-Яа-яё])/i,
  order: /^Пример обозначения при заказе/i,
  spec: /^(Технические характеристики|Диапазоны измерени[йя]|Модификация|Номинальное давление|Материал защитной арматуры|Исполнени[яе]|Примечание|Показатель тепловой инерции|Схема|Габаритные размеры)/i,
}
type Kind = keyof typeof MARK | 'pre'

/** Режет описание на блоки по типовым заголовкам; «Пример обозначения…» в таблице делит её на характеристики и схему заказа. */
export function describePage(html: string, name: string, slug: string): FamilyContent['pages'][number] & { apps: string[]; feats: string[]; standard: string | null } {
  const $ = cheerio.load(html, null, false)
  const specGroups: { title: string; html: string }[] = []
  let orderHtml = ''
  const apps: string[] = []; const feats: string[] = []; const rest: string[] = []
  let standard: string | null = null
  let kind: Kind = 'pre'; let title = 'Характеристики'
  const texts = ($e: cheerio.Cheerio<AnyNode>) => $e.find('li').length ? $e.find('li').map((_, li) => clean($(li).text())).get() : [clean($e.text())]
  const outer = (n: AnyNode) => $.html(n)

  for (const node of $.root().contents().toArray()) {
    const $n = $(node)
    if (node.type !== 'tag') { const t = clean($n.text()); if (t) rest.push(t); continue }
    const t = clean($n.text())
    if (!t && !$n.find('img').length) continue
    const head = /^(p|strong|em)$/.test(node.tagName) && t.length < 70 ? t.replace(/:$/, '') : ''
    const hit = (Object.keys(MARK) as (keyof typeof MARK)[]).find((k) => head && MARK[k].test(head))
    if (hit) { kind = hit; title = head; if (hit === 'order') orderHtml += `<p><strong>${head}</strong></p>`; continue }
    if (node.tagName === 'table') {
      // pressure: строка «Пример обозначения…» внутри таблицы
      const rows = $n.find('tr').toArray()
      const cut = rows.findIndex((r) => MARK.order.test(clean($(r).text())))
      if (cut >= 0) {
        const mk = (rs: AnyNode[]) => `<table><tbody>${rs.map(outer).join('')}</tbody></table>`
        if (cut > 0) specGroups.push({ title: 'Технические характеристики', html: mk(rows.slice(0, cut)) })
        orderHtml += mk(rows.slice(cut))
        kind = 'order'
      } else if (kind === 'order') orderHtml += outer(node)
      else specGroups.push({ title: kind === 'spec' || kind === 'pre' ? title : title, html: outer(node) })
      continue
    }
    if (kind === 'order') { orderHtml += outer(node); continue }
    if (kind === 'apps') { apps.push(...texts($n)); continue }
    if (kind === 'features') { feats.push(...texts($n)); continue }
    if (kind === 'spec') { const ul = node.tagName === 'ul' || node.tagName === 'ol'; specGroups.push({ title, html: ul || t.length > 0 ? outer(node) : '' }); continue }
    // preamble
    const tu = /ТУ\s*[\d\-.]+/.exec(t)
    if (tu && !standard) { standard = tu[0].replace(/\s+/g, ' '); continue }
    rest.push(t)
  }
  return { slug, name, specGroups: specGroups.filter((g) => g.html), orderHtml, rest: rest.join(' ').slice(0, 600), apps, feats, standard }
}

export function describeFamily(summaryFallback: string, pages: ReturnType<typeof describePage>[]): FamilyContent {
  const uniq = (a: string[]) => [...new Set(a.filter((x) => x.length > 3))]
  const applications = uniq(pages.flatMap((p) => p.apps)).slice(0, 8)
  const advantages = uniq(pages.flatMap((p) => p.feats)).slice(0, 6)
  const summary = applications[0]?.replace(/\s*\/\s*$/, '') ?? advantages[0] ?? summaryFallback
  return { summary: summary.length > 220 ? summary.slice(0, 217).replace(/\s\S*$/, '') + '…' : summary, standard: pages.find((p) => p.standard)?.standard ?? null, applications, advantages, pages: pages.map(({ slug, name, specGroups, orderHtml, rest }) => ({ slug, name, specGroups, orderHtml, rest })) }
}
