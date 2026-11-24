import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { t } from '@/lib/motion'
import { ChevronDown, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useRef, useState } from 'react'
import { q as queries } from '@/api/queries'
import type { CatalogQuery } from '@/api'
import { useCategories } from '@/api/useCategories'
import type { CategoryId } from '@/data/types'
import type { CatalogSearch } from '@/lib/catalogSearch'
import { cn } from '@/lib/cn'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Async } from '@/components/ui/Async'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/Section'
import { useSeo } from '@/lib/seo'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/States'
import { ProductCard, ProductCardSkeleton } from './ProductCard'

const PER_PAGE = 12

type Props = {
  category?: CategoryId
  search: CatalogSearch
  onChange: (patch: Partial<CatalogSearch>) => void
}

const sortOptions = [{ value: 'default', label: 'По умолчанию' }, { value: 'name', label: 'По названию' }]

export function CatalogView({ category, search, onChange }: Props) {
  const { categories } = useCategories()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [text, setText] = useState(search.q ?? '')
  const [prevQ, setPrevQ] = useState(search.q)
  if (prevQ !== search.q) { setPrevQ(search.q); setText(search.q ?? '') }
  // debounce поиска
  useEffect(() => {
    const t = setTimeout(() => { if ((search.q ?? '') !== text) onChange({ q: text || undefined, page: undefined }) }, 350)
    return () => clearTimeout(t)
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps

  const cat = categories.find((c) => c.id === category)
  useSeo({ title: cat ? `${cat.name} — каталог` : 'Каталог продукции', description: cat ? `${cat.name}: ${cat.count} позиций. Подбор модификации, документация, заказ.` : undefined })
  const query: CatalogQuery = { ...search, category, perPage: PER_PAGE }
  const res = useQuery(queries.products(query))
  const view = search.view ?? 'grid'
  const fCount = Object.values(search.f ?? {}).reduce((n, v) => n + v.length, 0)
  const activeCount = (search.sub?.length ?? 0) + fCount + (search.q ? 1 : 0)

  /** Сброс фильтров и поиска: сортировка и вид остаются. */
  const clearFilters = () => { setText(''); onChange({ q: undefined, sub: undefined, f: undefined, page: undefined }) }
  const resultsTop = useRef<HTMLDivElement>(null)
  const goPage = (p: number) => {
    onChange({ page: p })
    resultsTop.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const toggleSub = (id: string) => {
    const cur = search.sub ?? []
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    onChange({ sub: next.length ? next : undefined, page: undefined })
  }
  const toggleAttr = (name: string, v: string) => {
    const f = { ...(search.f ?? {}) }
    const cur = f[name] ?? []
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
    if (next.length) f[name] = next
    else delete f[name]
    onChange({ f: Object.keys(f).length ? f : undefined, page: undefined })
  }

  const group = (title: string, opts: { value: string; label: string; count: number; checked: boolean; onToggle: () => void }[]) =>
    opts.length > 0 && <FacetGroup key={title} title={title} opts={opts} />

  const facets = res.data?.facets
  const filters = (
    <div>
      <nav aria-label="Категории" className="border-b border-ink-200 pb-4">
        <p className="mb-2 text-[0.9375rem] font-semibold text-brand-900">Категории</p>
        <ul className="space-y-0.5">
          <li><Link to="/catalog" search={{}} className={cn('block rounded-sm px-2 py-1.5 text-sm hover:bg-ink-100', !category && 'bg-brand-50 font-medium text-brand-900')}>Все товары</Link></li>
          {categories.map((c) => (
            <li key={c.id}><Link to="/catalog/$category" params={{ category: c.id }} search={{}} className={cn('flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-ink-100', category === c.id && 'bg-brand-50 font-medium text-brand-900')}><span className="flex-1">{c.name}</span><span className="text-sm text-ink-500">{c.count}</span></Link></li>
          ))}
        </ul>
      </nav>
      {group('Подкатегория', (facets?.subs ?? []).map((x) => ({ value: x.id, label: x.name, count: x.count, checked: search.sub?.includes(x.id) ?? false, onToggle: () => toggleSub(x.id) })))}
      {(facets?.attrs ?? []).map((a) => (
        <div key={a.name}>{group(a.name, a.values.map((v) => ({ value: v.value, label: v.value, count: v.count, checked: search.f?.[a.name]?.includes(v.value) ?? false, onToggle: () => toggleAttr(a.name, v.value) })))}</div>
      ))}
      
    </div>
  )

  const page = search.page ?? 1
  const pages = res.data ? Math.max(1, Math.ceil(res.data.total / PER_PAGE)) : 1

  return (
    <>
      <PageHeader title={cat?.name ?? 'Каталог продукции'} lead={cat ? `${cat.count} позиций` : 'Датчики давления и температуры, преобразователи, узлы и детали для ремонта и монтажа'}>
        <Breadcrumbs items={cat ? [{ label: 'Каталог', link: { to: '/catalog' } }, { label: cat.name }] : [{ label: 'Каталог' }]} />
      </PageHeader>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block" aria-label="Фильтры">{filters}</aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 basis-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
              <Input type="search" aria-label="Поиск по каталогу" placeholder="Например: VMP-ДИ, ТПП или обозначение для заказа" className="pl-9" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <Button variant="outline" className="flex-1 sm:flex-none lg:hidden" onClick={() => setFiltersOpen(true)}><SlidersHorizontal className="size-4" aria-hidden />Фильтры{activeCount > 0 && ` (${activeCount})`}</Button>
            <Select aria-label="Сортировка" className="w-auto flex-1 sm:w-52 sm:flex-none" value={search.sort ?? 'default'} onChange={(v) => onChange({ sort: v as CatalogSearch['sort'] })} options={sortOptions} />
            <div role="group" aria-label="Вид" className="hidden overflow-hidden rounded-sm border border-ink-300 sm:flex">
              {([['grid', LayoutGrid, 'Сетка'], ['list', List, 'Список']] as const).map(([v, I, l]) => (
                <button key={v} type="button" aria-label={l} aria-pressed={view === v} onClick={() => onChange({ view: v })} className={cn('grid size-11 place-items-center', view === v ? 'bg-brand-900 text-white' : 'hover:bg-ink-100')}><I className="size-4" aria-hidden /></button>
              ))}
            </div>
          </div>

          <div ref={resultsTop} className="scroll-mt-32" />
          {activeCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Выбранные фильтры">
              {search.q && <Chip label={`Поиск: «${search.q}»`} onRemove={() => { setText(''); onChange({ q: undefined, page: undefined }) }} />}
              {(search.sub ?? []).map((id) => <Chip key={id} label={facets?.subs.find((x) => x.id === id)?.name ?? id} onRemove={() => toggleSub(id)} />)}
              {Object.entries(search.f ?? {}).flatMap(([name, vals]) => vals.map((v) => <Chip key={`${name}:${v}`} label={`${name}: ${v}`} onRemove={() => toggleAttr(name, v)} />))}
              <button type="button" onClick={clearFilters} className="px-2 py-1 text-[0.9375rem] font-medium text-brand-700 underline underline-offset-4 hover:text-brand-900">Сбросить всё</button>
            </div>
          )}
          {res.data && <p className="mb-4 text-[0.9375rem] text-ink-600" aria-live="polite">Найдено: <b className="text-brand-900">{res.data.total}</b>{res.data.matchedBy && <> · точного совпадения нет, показана серия <b className="font-mono text-brand-900">{res.data.matchedBy}</b> — соберите обозначение в конфигураторе</>}</p>}
          <h2 className="sr-only">Товары</h2>

          <Async
            query={res}
            skeleton={<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>}
            isEmpty={(d) => d.items.length === 0}
            empty={<EmptyState text="Попробуйте изменить параметры фильтров или сбросить их." action={<Button variant="outline" onClick={clearFilters}>Сбросить фильтры</Button>} />}
          >
            {(d) => (
              <>
                <div className={cn('grid gap-5', view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {d.items.map((p, i) => (
                      <motion.div key={p.id} layout="position" className="h-full [&>*]:h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: t('base', Math.min(i, 8) * 0.045) }} exit={{ opacity: 0, transition: t('fast') }}>
                        <ProductCard p={p} layout={view} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {pages > 1 && (
                  <nav aria-label="Страницы" className="mt-8 flex justify-center gap-1.5">
                    {Array.from({ length: pages }).map((_, i) => (
                      <button key={i} type="button" aria-current={page === i + 1 ? 'page' : undefined} aria-label={`Страница ${i + 1}`} onClick={() => goPage(i + 1)}
                        className={cn('size-10 rounded-sm border text-sm font-medium', page === i + 1 ? 'border-brand-900 bg-brand-900 text-white' : 'border-ink-300 hover:border-brand-700')}>{i + 1}</button>
                    ))}
                  </nav>
                )}
              </>
            )}
          </Async>
        </div>
      </div>

      <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="animate-fade-in fixed inset-0 z-60 bg-brand-950/60 lg:hidden" />
          <Dialog.Content className="animate-drawer-in fixed inset-y-0 left-0 z-61 flex w-[min(22rem,90vw)] flex-col bg-white lg:hidden" data-lenis-prevent="">
            <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
              <Dialog.Title className="font-display text-xl font-semibold text-brand-900">Фильтры</Dialog.Title>
              <Dialog.Description className="sr-only">Отбор товаров по параметрам</Dialog.Description>
              <Dialog.Close className="grid size-10 place-items-center rounded-sm hover:bg-ink-100" aria-label="Закрыть фильтры"><X className="size-6" aria-hidden /></Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-5">{filters}</div>
            <div className="flex gap-2 border-t border-ink-200 p-4">
              {activeCount > 0 && <Button variant="outline" onClick={clearFilters}>Сбросить</Button>}
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>Показать {res.data?.total ?? ''}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 border border-brand-900 bg-brand-50 py-1 pr-1 pl-3 text-[0.9375rem] text-brand-900">
      <span className="truncate">{label}</span>
      <button type="button" onClick={onRemove} aria-label={`Убрать фильтр: ${label}`} className="grid size-7 shrink-0 place-items-center hover:bg-brand-100"><X className="size-4" aria-hidden /></button>
    </span>
  )
}

const VISIBLE = 6

/** Группа фильтра: сворачивается; открыта, если в ней что-то выбрано или значений немного. Длинный список показывает первые 6. */
function FacetGroup({ title, opts }: { title: string; opts: { value: string; label: string; count: number; checked: boolean; onToggle: () => void }[] }) {
  const selected = opts.filter((o) => o.checked).length
  const [open, setOpen] = useState(selected > 0 || opts.length <= 5)
  const [all, setAll] = useState(false)
  const shown = all ? opts : [...opts.filter((o) => o.checked), ...opts.filter((o) => !o.checked)].slice(0, Math.max(VISIBLE, selected))
  return (
    <fieldset className="border-b border-ink-200 py-3">
      <legend className="sr-only">{title}</legend>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 py-1 text-left text-[0.9375rem] font-semibold text-brand-900">
        <span className="flex-1">{title}</span>
        {selected > 0 && <span className="bg-brand-900 px-1.5 text-sm text-white">{selected}</span>}
        <ChevronDown className={cn('size-4 shrink-0 text-ink-500 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="mt-2 space-y-0.5">
          {shown.map((o) => (
            <label key={o.value} className="flex min-h-9 cursor-pointer items-start gap-2.5 py-1 text-[0.9375rem] hover:text-brand-700">
              <input type="checkbox" className="mt-1 size-4 shrink-0 accent-brand-900" checked={o.checked} onChange={o.onToggle} />
              <span className="flex-1">{o.label}</span>
              <span className="text-sm text-ink-500">{o.count}</span>
            </label>
          ))}
          {opts.length > shown.length && <button type="button" onClick={() => setAll(true)} className="py-1 text-[0.9375rem] font-medium text-brand-700 underline underline-offset-4">Показать все ({opts.length})</button>}
          {all && opts.length > VISIBLE && <button type="button" onClick={() => setAll(false)} className="py-1 text-[0.9375rem] font-medium text-brand-700 underline underline-offset-4">Свернуть</button>}
        </div>
      )}
    </fieldset>
  )
}
