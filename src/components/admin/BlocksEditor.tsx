import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { useConfirm } from './kit'
import { RichText } from './RichText'

type Cell = { text: string; head: boolean; span: number }
type Block = { type: 'p'; text: string } | { type: 'h'; text: string } | { type: 'table'; rows: Cell[][] }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** HTML ячейки → текст с простой разметкой: **жирный**, _{нижний индекс}, ^{степень}. Неподдерживаемое → null. */
export function toMarked(node: Node): string | null {
  let out = ''
  for (const n of Array.from(node.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = (n.textContent ?? '').replace(/\s+/g, ' ')
      // текст, похожий на нашу разметку, исказился бы при сохранении — такой блок правится обычным редактором
      if (/\*\*|_\{|\^\{|\]\(/.test(t)) return null
      out += t
      continue
    }
    const el = n as Element
    if (el.tagName === 'BR') { out += '\n'; continue }
    const inner = toMarked(el)
    if (inner === null) return null
    // пустое форматирование (<strong></strong>) ничего не несёт и ломает разметку
    if (!inner.trim() && el.tagName !== 'P') { out += inner; continue }
    if (el.tagName === 'SUB') out += `_{${inner}}`
    else if (el.tagName === 'SUP') out += `^{${inner}}`
    else if (el.tagName === 'STRONG' || el.tagName === 'B') out += `**${inner}**`
    else if (el.tagName === 'A' && /^(https?:|\/)/.test(el.getAttribute('href') ?? '')) out += `[${inner}](${el.getAttribute('href')})`
    else if (el.tagName === 'P' && node.nodeType === 1 && (node as Element).tagName !== 'BODY') out += `${inner}\n`
    else return null
  }
  return out
}
export const fromMarked = (s: string) => esc(s)
  .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
  .replace(/_\{(.+?)\}/gs, '<sub>$1</sub>')
  .replace(/\^\{(.+?)\}/gs, '<sup>$1</sup>')
  .replace(/\[([^\]]+)\]\(((?:https?:|\/)[^)\s]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\n/g, '<br>')
export const tidy = (s: string) => s.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').trim()

/** Разбирает HTML в простые блоки. Если встретилось неподдерживаемое (списки, картинки, ссылки), возвращает null: тогда используется текстовый редактор. */
export function parseBlocks(html: string): Block[] | null {
  if (!html.trim()) return []
  const root = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body
  const out: Block[] = []
  for (const n of Array.from(root.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE) { const t = (n.textContent ?? '').replace(/\s+/g, ' ').trim(); if (t) out.push({ type: 'p', text: t }); continue }
    const el = n as Element
    const tag = el.tagName
    if (tag === 'P' || tag === 'H2' || tag === 'H3' || tag === 'H4') {
      const text = toMarked(el)
      if (text === null) return null
      if (!text.trim()) continue
      out.push({ type: tag === 'P' ? 'p' : 'h', text: tidy(text) })
    } else if (tag === 'TABLE') {
      const rows: Cell[][] = []
      for (const tr of Array.from(el.querySelectorAll('tr'))) {
        const cells: Cell[] = []
        for (const c of Array.from(tr.children)) {
          if (c.tagName !== 'TD' && c.tagName !== 'TH') continue
          const text = toMarked(c)
          if (text === null || c.hasAttribute('rowspan')) return null
          cells.push({ text: tidy(text), head: c.tagName === 'TH', span: Math.max(1, Number(c.getAttribute('colspan')) || 1) })
        }
        rows.push(cells)
      }
      if (rows.length === 0) return null
      // сетка редактора ровная: ширина = самая широкая строка по числу ячеек; лишние colspan и «рваные» строки выравниваются
      const n = Math.max(...rows.map((r) => r.length))
      for (const r of rows) {
        let w = 0
        for (const c of r) { c.span = Math.max(1, Math.min(c.span, n - w - (r.length - r.indexOf(c) - 1))); w += c.span }
        if (w < n && r.length) r[r.length - 1].span += n - w
      }
      out.push({ type: 'table', rows })
    } else return null
  }
  return out
}

export function blocksToHtml(blocks: Block[]): string {
  return blocks.map((b) => {
    if (b.type === 'p') return `<p>${fromMarked(b.text)}</p>`
    if (b.type === 'h') return `<h3>${fromMarked(b.text)}</h3>`
    return `<table><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<${c.head ? 'th' : 'td'}${c.span > 1 ? ` colspan="${c.span}"` : ''}>${fromMarked(c.text)}</${c.head ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</tbody></table>`
  }).join('')
}

const cols = (rows: Cell[][]) => Math.max(1, ...rows.map((r) => r.reduce((n, c) => n + c.span, 0)))
const blank = (head = false): Cell => ({ text: '', head, span: 1 })

function TableGrid({ rows, onChange }: { rows: Cell[][]; onChange: (r: Cell[][]) => void }) {
  const confirm = useConfirm()
  const n = cols(rows)
  const setCell = (ri: number, ci: number, patch: Partial<Cell>) => onChange(rows.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? { ...c, ...patch } : c)) : r)))
  const headerRow = rows[0]?.every((c) => c.head) ?? false

  const addCol = () => onChange(rows.map((r) => (r.length === 1 && r[0].span === n ? [{ ...r[0], span: n + 1 }] : [...r, blank(r.every((c) => c.head))])))
  const delCol = async () => {
    if (n <= 1) return
    const has = rows.some((r) => !(r.length === 1 && r[0].span === n) && r[r.length - 1]?.text.trim())
    if (has && !(await confirm({ title: 'Удалить последний столбец?', text: 'Текст в нём будет потерян.', confirmLabel: 'Удалить' }))) return
    onChange(rows.map((r) => (r.length === 1 && r[0].span === n ? [{ ...r[0], span: n - 1 }] : r.slice(0, -1))))
  }
  const addRow = () => onChange([...rows, Array.from({ length: n }, () => blank())])
  const moveRow = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= rows.length) return; const next = [...rows]; [next[i], next[j]] = [next[j], next[i]]; onChange(next) }
  const toggleHeader = () => onChange(rows.map((r, i) => (i === 0 ? r.map((c) => ({ ...c, head: !headerRow })) : r)))

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-[36rem] space-y-1">
          {rows.map((r, ri) => (
            <div key={ri} className="flex items-stretch gap-1">
              <div className="flex w-16 shrink-0 items-center justify-end">
                <button type="button" aria-label="Строка выше" disabled={ri === 0} onClick={() => moveRow(ri, -1)} className="grid size-7 place-items-center text-ink-500 hover:text-brand-900 disabled:opacity-30"><ArrowUp className="size-4" aria-hidden /></button>
                <button type="button" aria-label="Строка ниже" disabled={ri === rows.length - 1} onClick={() => moveRow(ri, 1)} className="grid size-7 place-items-center text-ink-500 hover:text-brand-900 disabled:opacity-30"><ArrowDown className="size-4" aria-hidden /></button>
              </div>
              <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                {r.map((c, ci) => (
                  <textarea key={ci} aria-label={`Строка ${ri + 1}, ячейка ${ci + 1}`} rows={Math.max(1, c.text.split('\n').length)} value={c.text} onChange={(e) => setCell(ri, ci, { text: e.target.value })} style={{ gridColumn: `span ${c.span}` }}
                    className={`min-h-10 resize-y border border-ink-300 px-2.5 py-2 text-[0.9375rem] leading-snug focus:border-brand-500 focus:outline-none ${c.head ? 'bg-ink-100 font-semibold' : 'bg-white'}`} />
                ))}
              </div>
              <button type="button" aria-label={`Удалить строку ${ri + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== ri))} className="grid w-8 shrink-0 place-items-center text-ink-500 hover:text-danger"><Trash2 className="size-4" aria-hidden /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={addRow}><Plus className="size-4" aria-hidden />Строка</Button>
        <Button variant="outline" size="sm" onClick={addCol}><Plus className="size-4" aria-hidden />Столбец</Button>
        <Button variant="ghost" size="sm" disabled={n <= 1} onClick={() => void delCol()}>Убрать последний столбец</Button>
        <label className="ml-auto flex items-center gap-2 text-[0.9375rem]"><input type="checkbox" className="size-4 accent-brand-900" checked={headerRow} onChange={toggleHeader} />Первая строка — заголовки</label>
      </div>
    </div>
  )
}

/** Редактор «текст + таблицы» без HTML: абзацы, подзаголовки и таблицы с кнопками. Сложный контент открывается в текстовом редакторе. */
export function BlocksEditor({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (html: string) => void }) {
  const confirm = useConfirm()
  const blocks = parseBlocks(value)
  if (blocks === null) return <RichText id={id} label={label} value={value} onChange={onChange} />

  const set = (next: Block[]) => onChange(blocksToHtml(next))
  const upd = (i: number, b: Block) => set(blocks.map((x, j) => (j === i ? b : x)))
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= blocks.length) return; const n = [...blocks]; [n[i], n[j]] = [n[j], n[i]]; set(n) }

  return (
    <Field label={label} htmlFor={id}>
      <div id={id} className="space-y-4">
        {blocks.length === 0 && <p className="text-[0.9375rem] text-ink-500">Здесь пока пусто. Добавьте таблицу или текст кнопками ниже.</p>}
        {blocks.map((b, i) => (
          <div key={i} className="border border-ink-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-1">
              <span className="mr-auto text-sm font-medium text-ink-500">{b.type === 'table' ? 'Таблица' : b.type === 'h' ? 'Подзаголовок' : 'Текст'}</span>
              <button type="button" aria-label="Блок выше" disabled={i === 0} onClick={() => move(i, -1)} className="grid size-7 place-items-center text-ink-500 hover:text-brand-900 disabled:opacity-30"><ArrowUp className="size-4" aria-hidden /></button>
              <button type="button" aria-label="Блок ниже" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} className="grid size-7 place-items-center text-ink-500 hover:text-brand-900 disabled:opacity-30"><ArrowDown className="size-4" aria-hidden /></button>
              <button type="button" aria-label="Удалить блок" onClick={async () => { if (b.type !== 'table' || await confirm({ title: 'Удалить таблицу?', text: 'Все её строки будут удалены после сохранения товара.' })) set(blocks.filter((_, j) => j !== i)) }} className="grid size-7 place-items-center text-ink-500 hover:text-danger"><Trash2 className="size-4" aria-hidden /></button>
            </div>
            {b.type === 'table' ? <TableGrid rows={b.rows} onChange={(rows) => upd(i, { ...b, rows })} /> : (
              <div className="space-y-2">
                <textarea aria-label={b.type === 'h' ? 'Подзаголовок' : 'Текст'} rows={Math.max(2, b.text.split('\n').length)} value={b.text} onChange={(e) => upd(i, { ...b, text: e.target.value })} className={`w-full border border-ink-300 px-3 py-2 text-[0.9375rem] focus:border-brand-500 focus:outline-none ${b.type === 'h' ? 'font-semibold' : ''}`} />
              </div>
            )}
          </div>
        ))}
        <p className="text-sm text-ink-500">Форматирование внутри ячейки и текста: **жирный**, нижний индекс _{'{'}2{'}'}, степень ^{'{'}3{'}'}.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => set([...blocks, { type: 'table', rows: [[{ text: 'Параметр', head: true, span: 1 }, { text: 'Значение', head: true, span: 1 }], [blank(), blank()]] }])}><Plus className="size-4" aria-hidden />Таблица</Button>
          <Button variant="outline" size="sm" onClick={() => set([...blocks, { type: 'p', text: '' }])}><Plus className="size-4" aria-hidden />Текст</Button>
          <Button variant="outline" size="sm" onClick={() => set([...blocks, { type: 'h', text: '' }])}><Plus className="size-4" aria-hidden />Подзаголовок</Button>
        </div>
      </div>
    </Field>
  )
}
