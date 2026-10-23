import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { t } from '@/lib/motion'
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { q as queries } from '@/api/queries'
import type { CatalogQuery } from '@/api'
import { categories } from '@/data'
import type { CategoryId } from '@/data/types'
import type { CatalogSearch } from '@/lib/catalogSearch'
import { cn } from '@/lib/cn'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Async } from '@/components/ui/Async'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/Section'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/States'
import { CategoryIcon } from '@/components/illustrations/CategoryIcon'
import { ProductCard, ProductCardSkeleton } from './ProductCard'

const PER_PAGE = 12

type Props = {
  category?: CategoryId
  search: CatalogSearch
  onChange: (patch: Partial<CatalogSearch>) => void
  onReset: () => void
}

const sortOptions = [{ value: 'default', label: 'Как на старом сайте' }, { value: 'name', label: 'По названию' }]

export function CatalogView({ category, search, onChange, onReset }: Props) {
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
  const query: CatalogQuery = { ...search, category, perPage: PER_PAGE }
  const res = useQuery(queries.products(query))
  const view = search.view ?? 'grid'
  const fCount = Object.values(search.f ?? {}).reduce((n, v) => n + v.length, 0)
  const activeCount = (search.sub?.length ?? 0) + fCount + (search.q ? 1 : 0)

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

  const group = (title: string, opts: { value: string; label: string; checked: boolean; onToggle: () => void }[]) =>
    opts.length > 0 && (
      <fieldset className="border-b border-ink-200 py-4">
        <legend className="mb-2 text-sm font-semibold text-brand-900">{title}</legend>
        <div className="space-y-1.5">
          {opts.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-start gap-2.5 text-sm hover:text-accent-700">
              <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-accent-500" checked={o.checked} onChange={o.onToggle} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )

  const facets = res.data?.facets
  const filters = (
    <div>
      <nav aria-label="Категории" className="border-b border-ink-200 pb-4">
        <p className="mb-2 text-sm font-semibold text-brand-900">Категории</p>
        <ul className="space-y-0.5">
          <li><Link to="/catalog" search={{}} className={cn('block rounded-sm px-2 py-1.5 text-sm hover:bg-ink-100', !category && 'bg-brand-50 font-medium text-brand-900')}>Все товары</Link></li>
          {categories.map((c) => (
            <li key={c.id}><Link to="/catalog/$category" params={{ category: c.id }} search={{}} className={cn('flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-ink-100', category === c.id && 'bg-brand-50 font-medium text-brand-900')}><CategoryIcon name={c.icon} className="size-4 shrink-0 text-ink-500" />{c.name}</Link></li>
          ))}
        </ul>
      </nav>
      {group('Подкатегория', (facets?.subs ?? []).map((x) => ({ value: x.id, label: `${x.name} (${x.count})`, checked: search.sub?.includes(x.id) ?? false, onToggle: () => toggleSub(x.id) })))}
      {(facets?.attrs ?? []).map((a) => (
        <div key={a.name}>{group(a.name, a.values.map((v) => ({ value: v.value, label: `${v.value} (${v.count})`, checked: search.f?.[a.name]?.includes(v.value) ?? false, onToggle: () => toggleAttr(a.name, v.value) })))}</div>
      ))}
      {activeCount > 0 && <Button variant="outline" className="w-full" onClick={onReset}>Сбросить фильтры ({activeCount})</Button>}
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
              <Input type="search" aria-label="Поиск по каталогу" placeholder="Поиск: серия, название" className="pl-9" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}><SlidersHorizontal className="size-4" aria-hidden />Фильтры{activeCount > 0 && ` (${activeCount})`}</Button>
            <Select aria-label="Сортировка" className="w-full sm:w-52" value={search.sort ?? 'default'} onChange={(v) => onChange({ sort: v as CatalogSearch['sort'] })} options={sortOptions} />
            <div role="group" aria-label="Вид" className="flex overflow-hidden rounded-sm border border-ink-300">
              {([['grid', LayoutGrid, 'Сетка'], ['list', List, 'Список']] as const).map(([v, I, l]) => (
                <button key={v} type="button" aria-label={l} aria-pressed={view === v} onClick={() => onChange({ view: v })} className={cn('grid size-11 place-items-center', view === v ? 'bg-brand-900 text-white' : 'hover:bg-ink-100')}><I className="size-4" aria-hidden /></button>
              ))}
            </div>
          </div>

          {res.data && <p className="mb-4 text-sm text-ink-600" aria-live="polite">Найдено: <b className="text-brand-900">{res.data.total}</b></p>}

          <Async
            query={res}
            skeleton={<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>}
            isEmpty={(d) => d.items.length === 0}
            empty={<EmptyState text="Попробуйте изменить параметры фильтров или сбросить их." action={<Button variant="outline" onClick={onReset}>Сбросить фильтры</Button>} />}
          >
            {(d) => (
              <>
                <div className={cn('grid gap-5', view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {d.items.map((p) => (
                      <motion.div key={p.id} layout="position" className="h-full [&>*]:h-full" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: t('base') }} exit={{ opacity: 0, transition: t('fast') }}>
                        <ProductCard p={p} layout={view} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {pages > 1 && (
                  <nav aria-label="Страницы" className="mt-8 flex justify-center gap-1.5">
                    {Array.from({ length: pages }).map((_, i) => (
                      <button key={i} type="button" aria-current={page === i + 1 ? 'page' : undefined} onClick={() => onChange({ page: i + 1 })}
                        className={cn('size-10 rounded-sm border text-sm font-medium', page === i + 1 ? 'border-brand-900 bg-brand-900 text-white' : 'border-ink-300 hover:border-accent-500')}>{i + 1}</button>
                    ))}
                  </nav>
                )}
              </>
            )}
          </Async>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Фильтры">
          <button type="button" aria-label="Закрыть фильтры" className="animate-fade-in absolute inset-0 bg-brand-950/60" onClick={() => setFiltersOpen(false)} />
          <div className="animate-drawer-in absolute inset-y-0 left-0 w-[min(22rem,90vw)] overflow-y-auto bg-white p-5" data-lenis-prevent="">
            <div className="mb-2 flex items-center justify-between"><p className="text-lg font-semibold text-brand-900">Фильтры</p><button type="button" aria-label="Закрыть" onClick={() => setFiltersOpen(false)}><X className="size-6" aria-hidden /></button></div>
            {filters}
            <Button className="mt-4 w-full" onClick={() => setFiltersOpen(false)}>Показать {res.data?.total ?? ''}</Button>
          </div>
        </div>
      )}
    </>
  )
}
