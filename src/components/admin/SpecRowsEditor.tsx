import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fromMarked, tidy, toMarked } from './BlocksEditor'

export type SpecItem = { kind: 'row'; name: string; value: string } | { kind: 'head'; text: string }
export type SpecList = { header: [string, string] | null; items: SpecItem[] }

/**
 * Двухколоночная таблица «параметр — значение» → список строк. Строка из одной ячейки на всю ширину — подзаголовок.
 * Всё остальное (3+ столбца, объединения по вертикали, списки, картинки) — null: такие таблицы правятся как таблица.
 */
export function parseSpecList(html: string): SpecList | null {
  if (!html.trim()) return { header: null, items: [] }
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body
  const nodes = Array.from(body.childNodes).filter((n) => n.nodeType !== Node.TEXT_NODE || (n.textContent ?? '').trim())
  if (nodes.length !== 1 || (nodes[0] as Element).tagName !== 'TABLE') return null
  const trs = Array.from((nodes[0] as Element).querySelectorAll('tr'))
  const out: SpecList = { header: null, items: [] }
  for (const [i, tr] of trs.entries()) {
    const cells = Array.from(tr.children).filter((c) => c.tagName === 'TD' || c.tagName === 'TH')
    if (cells.some((c) => c.hasAttribute('rowspan'))) return null
    const texts = cells.map((c) => toMarked(c))
    if (texts.some((t) => t === null)) return null
    const t = texts.map((x) => tidy(x!))
    if (i === 0 && cells.length === 2 && cells.every((c) => c.tagName === 'TH')) { out.header = [t[0], t[1]]; continue }
    if (cells.length === 1) out.items.push({ kind: 'head', text: t[0] })
    else if (cells.length === 2) out.items.push({ kind: 'row', name: t[0], value: t[1] })
    else return null
  }
  return out
}

export function specListToHtml(l: SpecList): string {
  const head = l.header ? `<tr><th>${fromMarked(l.header[0])}</th><th>${fromMarked(l.header[1])}</th></tr>` : ''
  const rows = l.items.map((it) => (it.kind === 'head' ? `<tr><td colspan="2">${fromMarked(it.text)}</td></tr>` : `<tr><td>${fromMarked(it.name)}</td><td>${fromMarked(it.value)}</td></tr>`)).join('')
  return `<table><tbody>${head}${rows}</tbody></table>`
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9]+/g, ' ').trim()

/** Список характеристик: «параметр — значение», подзаголовки, порядок стрелками. */
export function SpecRowsEditor({ list, onChange, chosenLabels = [] }: { list: SpecList; onChange: (l: SpecList) => void; chosenLabels?: string[] }) {
  const set = (items: SpecItem[]) => onChange({ ...list, items })
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= list.items.length) return; const n = [...list.items]; [n[i], n[j]] = [n[j], n[i]]; set(n) }
  const chosen = chosenLabels.map(norm).filter(Boolean)
  const isDup = (name: string) => { const n = norm(name); return !!n && chosen.some((c) => n.startsWith(c.slice(0, 12)) || c.startsWith(n.slice(0, 12))) }
  const dupCount = list.items.filter((it) => it.kind === 'row' && isDup(it.name)).length

  return (
    <div className="space-y-2">
      {dupCount > 0 && (
        <p className="border border-accent-500/40 bg-accent-500/10 p-3 text-[0.9375rem] text-brand-950">
          {dupCount} {dupCount === 1 ? 'строка повторяет' : 'строки повторяют'} то, что клиент и так выбирает в «Выборе модификации» (отмечены ниже). Их можно удалить.
          <button type="button" className="ml-2 font-medium underline underline-offset-4" onClick={() => set(list.items.filter((it) => !(it.kind === 'row' && isDup(it.name))))}>Удалить повторы</button>
        </p>
      )}
      <div className="hidden grid-cols-[14rem_1fr_6.5rem] gap-2 px-1 text-sm font-medium text-ink-500 md:grid"><span>Параметр</span><span>Значение</span><span /></div>
      {list.items.map((it, i) => (
        <div key={i} className="grid items-start gap-2 md:grid-cols-[14rem_1fr_6.5rem]">
          {it.kind === 'head' ? (
            <input aria-label="Подзаголовок" value={it.text} onChange={(e) => set(list.items.map((x, j) => (j === i ? { kind: 'head', text: e.target.value } : x)))} placeholder="Подзаголовок группы" className="h-10 border border-ink-300 bg-ink-100 px-3 text-[0.9375rem] font-semibold focus:border-brand-500 focus:outline-none md:col-span-2" />
          ) : (
            <>
              <div>
                <input aria-label="Параметр" value={it.name} onChange={(e) => set(list.items.map((x, j) => (j === i ? { ...it, name: e.target.value } : x)))} placeholder="Например: Перегрузка" className="h-10 w-full border border-ink-300 bg-white px-3 text-[0.9375rem] focus:border-brand-500 focus:outline-none" />
                {isDup(it.name) && <span className="mt-1 inline-block text-sm text-accent-600">есть в «Выборе модификации»</span>}
              </div>
              <textarea aria-label="Значение" rows={Math.max(1, it.value.split('\n').length)} value={it.value} onChange={(e) => set(list.items.map((x, j) => (j === i ? { ...it, value: e.target.value } : x)))} placeholder="Например: до 1,5 × ВПИ" className="min-h-10 w-full resize-y border border-ink-300 bg-white px-3 py-2 text-[0.9375rem] leading-snug focus:border-brand-500 focus:outline-none" />
            </>
          )}
          <div className="flex">
            <button type="button" aria-label="Выше" disabled={i === 0} onClick={() => move(i, -1)} className="grid size-10 place-items-center text-ink-500 hover:text-brand-900 disabled:opacity-30"><ArrowUp className="size-4" aria-hidden /></button>
            <button type="button" aria-label="Ниже" disabled={i === list.items.length - 1} onClick={() => move(i, 1)} className="grid size-10 place-items-center text-ink-500 hover:text-brand-900 disabled:opacity-30"><ArrowDown className="size-4" aria-hidden /></button>
            <button type="button" aria-label="Удалить строку" onClick={() => set(list.items.filter((_, j) => j !== i))} className="grid size-10 place-items-center text-ink-500 hover:text-danger"><Trash2 className="size-4" aria-hidden /></button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={() => set([...list.items, { kind: 'row', name: '', value: '' }])}><Plus className="size-4" aria-hidden />Характеристика</Button>
        <Button variant="outline" size="sm" onClick={() => set([...list.items, { kind: 'head', text: '' }])}><Plus className="size-4" aria-hidden />Подзаголовок группы</Button>
      </div>
      <p className="text-sm text-ink-500">Перенос строки в значении — Enter. Нижний индекс: _{'{'}2{'}'}, степень: ^{'{'}3{'}'}, жирный: **текст**.</p>
    </div>
  )
}
