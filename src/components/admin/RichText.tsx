import { Bold, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, RemoveFormatting, Table } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '@/api/http'
import { Field } from '@/components/ui/Field'
import { useUpload } from './primitives'

const base = () => mediaUrl('/assets/x').slice(0, -1)
/** В БД пути вида /assets/…, в редакторе — полные адреса, чтобы картинки отображались. */
const toEditor = (html: string) => html.replaceAll('/assets/', base())
const fromEditor = (html: string) => html.replaceAll(base(), '/assets/')

const TABLE = '<table><tbody>' + '<tr><th>Параметр</th><th>Значение</th></tr>'.repeat(1) + '<tr><td>&nbsp;</td><td>&nbsp;</td></tr>'.repeat(2) + '</tbody></table><p></p>'

function Btn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="grid size-8 place-items-center rounded-sm text-ink-700 hover:bg-ink-100">{children}</button>
}

/** Визуальный редактор текста: кнопки форматирования вместо HTML. Результат — очищенный сервером HTML. */
export function RichText({ label, id, value, onChange, minHeight = 160 }: { label: string; id: string; value: string; onChange: (html: string) => void; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { upload, busy } = useUpload()
  const file = useRef<HTMLInputElement>(null)

  // значение задаётся один раз: дальше редактор «владеет» содержимым, иначе курсор прыгает
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = toEditor(value)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [inCell, setInCell] = useState(false)
  useEffect(() => {
    const on = () => {
      const n = window.getSelection()?.anchorNode
      setInCell(!!n && !!ref.current?.contains(n) && !!(n.nodeType === 1 ? (n as Element) : n.parentElement)?.closest('td,th'))
    }
    document.addEventListener('selectionchange', on)
    return () => document.removeEventListener('selectionchange', on)
  }, [])

  /** Операции с таблицей по ячейке, где стоит курсор. */
  const cellOp = (op: 'row+' | 'row-' | 'col+' | 'col-') => {
    const n = window.getSelection()?.anchorNode
    const cell = (n && (n.nodeType === 1 ? (n as Element) : n.parentElement))?.closest('td,th') as HTMLTableCellElement | null
    const row = cell?.parentElement as HTMLTableRowElement | null
    const table = cell?.closest('table')
    if (!cell || !row || !table) return
    const idx = cell.cellIndex
    if (op === 'row+') {
      const copy = row.cloneNode(true) as HTMLTableRowElement
      copy.querySelectorAll('td,th').forEach((c) => { c.textContent = '\u00a0'; c.removeAttribute('rowspan') })
      row.after(copy)
    } else if (op === 'row-') {
      if (table.rows.length > 1) row.remove()
    } else if (op === 'col+') {
      Array.from(table.rows).forEach((r) => {
        const ref = r.cells[idx]
        if (!ref) return
        const c = document.createElement(ref.tagName)
        c.innerHTML = '&nbsp;'
        ref.after(c)
      })
    } else if (cell.parentElement && row.cells.length > 1) {
      Array.from(table.rows).forEach((r) => r.cells[idx]?.remove())
    }
    emit()
  }

  const emit = () => ref.current && onChange(fromEditor(ref.current.innerHTML))
  const run = (cmd: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(cmd, false, arg)
    emit()
  }
  return (
    <Field label={label} htmlFor={id}>
      <div className="overflow-hidden rounded-sm border border-ink-300 bg-white focus-within:border-brand-500">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-ink-200 bg-ink-50 p-1">
          <Btn title="Подзаголовок" onClick={() => run('formatBlock', 'h3')}><Heading2 className="size-4" aria-hidden /></Btn>
          <Btn title="Жирный" onClick={() => run('bold')}><Bold className="size-4" aria-hidden /></Btn>
          <Btn title="Курсив" onClick={() => run('italic')}><Italic className="size-4" aria-hidden /></Btn>
          <Btn title="Маркированный список" onClick={() => run('insertUnorderedList')}><List className="size-4" aria-hidden /></Btn>
          <Btn title="Нумерованный список" onClick={() => run('insertOrderedList')}><ListOrdered className="size-4" aria-hidden /></Btn>
          <Btn title="Ссылка" onClick={() => { const url = window.prompt('Адрес ссылки (https://…)'); if (url) run('createLink', url) }}><Link2 className="size-4" aria-hidden /></Btn>
          <Btn title="Вставить таблицу" onClick={() => run('insertHTML', TABLE)}><Table className="size-4" aria-hidden /></Btn>
          <Btn title="Вставить картинку" onClick={() => file.current?.click()}><ImagePlus className="size-4" aria-hidden /></Btn>
          <Btn title="Убрать форматирование" onClick={() => { run('removeFormat'); run('formatBlock', 'p') }}><RemoveFormatting className="size-4" aria-hidden /></Btn>
          {inCell && (
            <span className="ml-2 flex items-center gap-1 border-l border-ink-300 pl-2 text-sm">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => cellOp('row+')} className="px-2 py-1 hover:bg-ink-100">+ строка</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => cellOp('row-')} className="px-2 py-1 hover:bg-ink-100">− строка</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => cellOp('col+')} className="px-2 py-1 hover:bg-ink-100">+ столбец</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => cellOp('col-')} className="px-2 py-1 hover:bg-ink-100">− столбец</button>
            </span>
          )}
          {busy && <span className="ml-2 text-xs text-ink-500">Загрузка…</span>}
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" aria-label="Выбрать картинку" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) { const r = await upload(f); if (r) run('insertImage', r.url) }
            e.target.value = ''
          }} />
        </div>
        <div id={id} ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label}
          onInput={emit} onBlur={emit}
          onPaste={(e) => { e.preventDefault(); const t = e.clipboardData.getData('text/plain'); document.execCommand('insertText', false, t) }}
          className="prose-content p-3 focus:outline-none" style={{ minHeight }} />
      </div>
    </Field>
  )
}
