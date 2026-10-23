import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

type Row = { param: string; value: string }
const col = createColumnHelper<Row>()
const columns = [
  col.accessor('param', { header: 'Параметр', cell: (c) => <span className="text-ink-600">{c.getValue()}</span> }),
  col.accessor('value', { header: 'Значение', cell: (c) => <span className="font-mono text-[13px] text-brand-900">{c.getValue()}</span> }),
]

export function SpecTable({ rows, caption }: { rows: Row[]; caption?: string }) {
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })
  return (
    <div className="relative overflow-x-auto rounded-md border border-ink-200">
      <table className="w-full text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
          {table.getHeaderGroups().map((g) => (
            <tr key={g.id}>{g.headers.map((h) => <th key={h.id} scope="col" className="px-4 py-2.5 font-medium">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
          ))}
        </thead>
        <tbody className="divide-y divide-ink-200">
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="hover:bg-ink-50">{r.getVisibleCells().map((c) => <td key={c.id} className="px-4 py-2.5 align-top">{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
