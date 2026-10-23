import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type SortingState } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Download, File, FileArchive, FileCode, FileImage, FileText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { ReadingProgress } from '@/components/motion/ReadingProgress'
import { q } from '@/api/queries'
import { docKindLabels, docScopeLabels } from '@/data'
import type { MigratedDocument as DocItem } from '@/data/schema'
import { dateRu } from '@/lib/format'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Async } from '@/components/ui/Async'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/Section'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'

export const Route = createFileRoute('/docs')({
  validateSearch: z.object({
    q: z.string().optional().catch(undefined),
    type: z.string().optional().catch(undefined),
    category: z.string().optional().catch(undefined),
  }),
  component: DocsPage,
})

const icons: Record<string, typeof File> = { PDF: FileText, DWG: FileCode, ZIP: FileArchive, WEBP: FileImage }
const iconOf = (f: string) => icons[f] ?? File
const col = createColumnHelper<DocItem>()
const size = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} МБ` : `${kb} КБ`)

function DocsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const docs = useQuery(q.documents())
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const set = (patch: Partial<typeof search>) => void navigate({ search: (p) => ({ ...p, ...patch }), replace: true })

  const columns = useMemo(() => [
    col.accessor('title', {
      header: 'Название',
      cell: (c) => {
        const I = iconOf(c.row.original.file.format)
        return <span className="flex items-center gap-3"><I className="size-5 shrink-0 text-accent-600" aria-hidden /><span className="font-medium text-brand-900">{c.getValue()}</span></span>
      },
    }),
    col.accessor('kind', { header: 'Тип', cell: (c) => <Badge tone="brand">{docKindLabels[c.getValue()]}</Badge>, filterFn: 'equals' }),
    col.accessor('scope', { header: 'Категория', cell: (c) => <span className="text-ink-600">{docScopeLabels[c.getValue()]}</span>, filterFn: 'equals' }),
    col.accessor((r) => r.file.format, { id: 'format', header: 'Формат', cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span> }),
    col.accessor((r) => r.file.sizeKb, { id: 'sizeKb', header: 'Размер', cell: (c) => <span className="whitespace-nowrap text-ink-600">{size(c.getValue())}</span> }),
    col.accessor('date', { header: 'Дата', cell: (c) => <span className="whitespace-nowrap text-ink-600">{dateRu(c.getValue())}</span> }),
    col.display({ id: 'dl', header: () => <span className="sr-only">Скачать</span>, cell: (c) => <a href={c.row.original.file.url} download target="_blank" rel="noreferrer" aria-label={`Скачать ${c.row.original.title}`} className={buttonClass('outline', 'sm')}><Download className="size-4" aria-hidden />Скачать</a> }),
  ], [])

  const filters = useMemo(() => [
    ...(search.type ? [{ id: 'kind', value: search.type }] : []),
    ...(search.category ? [{ id: 'scope', value: search.category }] : []),
  ], [search.type, search.category])

  return (
    <>
      <ReadingProgress />
      <PageHeader title="Документация" lead="Сертификаты, декларации, свидетельства, патенты, каталоги и другие документы.">
        <Breadcrumbs items={[{ label: 'Документация' }]} />
      </PageHeader>
      <div className="container-page py-8">
        <Async query={docs} skeleton={<div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>} isEmpty={(d) => d.length === 0}>
          {(data) => (
            <DocsTable data={data} columns={columns} filters={filters} globalFilter={search.q ?? ''} sorting={sorting} setSorting={setSorting}
              type={search.type} category={search.category} onSearch={(v) => set({ q: v || undefined })} onType={(v) => set({ type: v === 'all' ? undefined : v })} onCategory={(v) => set({ category: v === 'all' ? undefined : v })} onReset={() => void navigate({ search: {} })} />
          )}
        </Async>
      </div>
    </>
  )
}

type TableProps = {
  data: DocItem[]; columns: ColumnDef<DocItem, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  filters: { id: string; value: string }[]; globalFilter: string; sorting: SortingState; setSorting: (s: SortingState) => void
  type?: string; category?: string
  onSearch: (v: string) => void; onType: (v: string) => void; onCategory: (v: string) => void; onReset: () => void
}

function DocsTable({ data, columns, filters, globalFilter, sorting, setSorting, type, category, onSearch, onType, onCategory, onReset }: TableProps) {
  const table = useReactTable({
    data, columns,
    state: { columnFilters: filters, globalFilter, sorting },
    onSortingChange: (u) => setSorting(typeof u === 'function' ? u(sorting) : u),
    globalFilterFn: (row, _id, v: string) => String(row.original.title).toLowerCase().includes(v.toLowerCase()),
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel(),
  })
  const rows = table.getRowModel().rows
  return (
    <>
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_14rem_14rem_auto]">
        <Input type="search" aria-label="Поиск по документам" placeholder="Поиск по названию" value={globalFilter} onChange={(e) => onSearch(e.target.value)} />
        <Select aria-label="Тип документа" value={type ?? 'all'} onChange={onType} options={[{ value: 'all', label: 'Все типы' }, ...Object.entries(docKindLabels).map(([v, label]) => ({ value: v, label }))]} />
        <Select aria-label="Категория" value={category ?? 'all'} onChange={onCategory} options={[{ value: 'all', label: 'Все категории' }, ...Object.entries(docScopeLabels).map(([value, label]) => ({ value, label }))]} />
        <Button variant="ghost" onClick={onReset}>Сбросить</Button>
      </div>
      {rows.length === 0 ? (
        <p role="status" className="rounded-md border border-dashed border-ink-300 p-10 text-center text-ink-600">Документы не найдены. Измените условия поиска.</p>
      ) : (
        <>
          <div className="relative hidden overflow-x-auto rounded-md border border-ink-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                {table.getHeaderGroups().map((g) => (
                  <tr key={g.id}>{g.headers.map((h) => {
                    const sorted = h.column.getIsSorted()
                    return (
                      <th key={h.id} scope="col" aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-4 py-3 font-medium">
                        {h.column.getCanSort() && h.column.id !== 'dl' ? (
                          <button type="button" onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 uppercase hover:text-brand-900">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {sorted === 'asc' ? <ArrowUp className="size-3" aria-hidden /> : sorted === 'desc' ? <ArrowDown className="size-3" aria-hidden /> : <ArrowUpDown className="size-3 opacity-50" aria-hidden />}
                          </button>
                        ) : flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    )
                  })}</tr>
                ))}
              </thead>
              <tbody className="divide-y divide-ink-200">
                {rows.map((r) => <tr key={r.id} className="hover:bg-ink-50">{r.getVisibleCells().map((c) => <td key={c.id} className="px-4 py-3 align-middle">{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => { const d = r.original; const I = iconOf(d.file.format); return (
              <li key={d.id} className="rounded-md border border-ink-200 p-4">
                <div className="flex gap-3"><I className="mt-0.5 size-5 shrink-0 text-accent-600" aria-hidden /><p className="font-medium text-brand-900">{d.title}</p></div>
                <p className="mt-2 text-xs text-ink-500">{docKindLabels[d.kind]} · {d.file.format} · {size(d.file.sizeKb)} · {dateRu(d.date)}</p>
                <a href={d.file.url} download target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm', 'mt-3')}><Download className="size-4" aria-hidden />Скачать</a>
              </li>
            ) })}
          </ul>
        </>
      )}
    </>
  )
}
