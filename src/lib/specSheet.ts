import { COMPANY } from '@/config'
import type { Product } from '@/data/types'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const rows = (list: [string, string][]) => list.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')

type Input = { p: Product; code: string; qty: number; config: { label: string; value: string }[]; price?: { unit: string; total: string } }

/**
 * Спецификация товара для печати / сохранения в PDF: выбранная модификация и все характеристики.
 * Открывается в новой вкладке с диалогом печати; если вкладку заблокировали — скачивается HTML-файлом.
 */
export function openSpecSheet({ p, code, qty, config, price }: Input) {
  const base = window.location.origin
  const abs = (u: string) => (u.startsWith('http') ? u : base + u)
  const several = p.content.pages.length > 1
  const specs = p.content.pages
    .filter((pg) => pg.specGroups.length)
    .map((pg) => `${several ? `<h3>${esc(pg.name)}</h3>` : ''}${pg.specGroups.map((g) => `${pg.specGroups.length > 1 ? `<h4>${esc(g.title)}</h4>` : ''}<div class="spec">${g.html}</div>`).join('')}`)
    .join('')
  const list = (title: string, items: string[]) => (items.length ? `<h2>${title}</h2><ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Спецификация — ${esc(code)}</title>
<base href="${base}/"><style>
  @page { size: A4; margin: 16mm 14mm; }
  body { font: 13px/1.45 Roboto, Arial, sans-serif; color: #1c2430; margin: 0 auto; max-width: 820px; padding: 24px; }
  header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #0b2a55; padding-bottom: 12px; }
  .brand { font: 700 18px/1.05 Arial, sans-serif; color: #2c69a7; } .brand span { display: block; color: #e67812; }
  .contacts { text-align: right; color: #5b6676; font-size: 12px; }
  h1 { font-size: 22px; color: #0b2a55; margin: 20px 0 4px; } h2 { font-size: 15px; color: #0b2a55; margin: 22px 0 8px; border-bottom: 1px solid #d5dbe3; padding-bottom: 4px; }
  h3 { font-size: 14px; color: #0b2a55; margin: 16px 0 6px; } h4 { font-size: 13px; margin: 12px 0 6px; }
  .code { font: 600 16px/1.3 'Roboto Mono', monospace; background: #f3f5f8; border: 1px solid #d5dbe3; padding: 8px 12px; display: inline-block; margin-top: 6px; }
  .top { display: grid; grid-template-columns: 1fr 180px; gap: 24px; align-items: start; } .top img { width: 180px; height: 180px; object-fit: contain; border: 1px solid #e3e7ed; }
  table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #d5dbe3; padding: 5px 8px; text-align: left; vertical-align: top; } th { background: #f3f5f8; font-weight: 500; width: 40%; }
  .spec table th { width: auto; } .spec p { margin: 6px 0; } .spec img { max-width: 100%; }
  footer { margin-top: 28px; border-top: 1px solid #d5dbe3; padding-top: 8px; color: #5b6676; font-size: 11px; }
  @media print { body { padding: 0; } a { color: inherit; text-decoration: none; } }
</style></head><body>
<header><div class="brand">ВАКУУММАШ<span>ЭЛЕКТРО</span></div><div class="contacts">${esc(COMPANY.phone)}<br>${esc(COMPANY.email)}<br>${esc(COMPANY.address)}</div></header>
<div class="top"><div><h1>${esc(p.name)}</h1><div>Обозначение для заказа:</div><div class="code">${esc(code)}</div>
${p.content.summary ? `<p>${esc(p.content.summary)}</p>` : ''}${p.content.standard ? `<p>${esc(p.content.standard)}</p>` : ''}</div>
${p.images[0] ? `<img src="${esc(abs(p.images[0]))}" alt="">` : ''}</div>
<h2>Выбранная модификация</h2><table>${rows([...config.map((c) => [c.label, c.value] as [string, string]), ['Количество', `${qty} шт.`], ...(price ? [['Цена за единицу', price.unit], ['Итого', price.total]] as [string, string][] : [['Цена', 'по запросу']] as [string, string][])])}</table>
${specs ? `<h2>Технические характеристики</h2>${specs}` : ''}
${list('Области применения', p.content.applications)}${list('Особенности', p.content.advantages)}
<footer>Сформировано ${new Date().toLocaleDateString('ru-RU')} на ${esc(base)} · ${esc(window.location.href)}</footer>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 300))</script>
</body></html>`

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  const w = window.open(url, '_blank')
  if (!w) {
    const a = Object.assign(document.createElement('a'), { href: url, download: `specifikaciya-${p.id}.html` })
    a.click()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
