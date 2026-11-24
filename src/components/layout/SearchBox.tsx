import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Search, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { q } from '@/api/queries'
import { useCategories } from '@/api/useCategories'
import type { ProductSummary } from '@/data/types'
import { cn } from '@/lib/cn'

/**
 * Поиск по каталогу с подсказками: пустое поле — популярные товары, от 2 символов — совпадения
 * (в том числе по полному обозначению для заказа). Стрелки ↑↓ выбирают, Enter открывает, Esc закрывает.
 */
export function SearchBox({ className, onDone, autoFocus, variant = 'dropdown' }: { className?: string; onDone?: () => void; autoFocus?: boolean; variant?: 'dropdown' | 'panel' }) {
  const navigate = useNavigate()
  const { categories } = useCategories()
  const listId = useId()
  const [text, setText] = useState('')
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(!!autoFocus)
  const [active, setActive] = useState(-1)

  // задержка, чтобы не запрашивать каталог на каждую букву
  useEffect(() => {
    const t = setTimeout(() => setTerm(text.trim()), 200)
    return () => clearTimeout(t)
  }, [text])

  const searching = term.length >= 2
  const popular = useQuery(q.popular())
  const found = useQuery({ ...q.products({ q: term, perPage: 6 }), enabled: searching })
  // популярных обычно мало: добираем до шести товарами каталога
  const rest = useQuery({ ...q.products({ perPage: 6 }), enabled: !searching })
  const suggested = [...(popular.data ?? []), ...(rest.data?.items ?? [])].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i).slice(0, 6)
  const items: ProductSummary[] = searching ? (found.data?.items ?? []) : suggested
  const catName = (id: string) => categories.find((c) => c.id === id)?.name

  const go = (p: ProductSummary) => {
    setOpen(false)
    onDone?.()
    void navigate({ to: '/catalog/$category/$productId', params: { category: p.category, productId: p.id } })
  }
  const all = () => {
    setOpen(false)
    onDone?.()
    void navigate({ to: '/catalog', search: { q: text.trim() || undefined } })
  }

  const status = searching
    ? (found.isFetching && !found.data ? 'Ищем…' : found.data?.total ? <>Найдено: {found.data.total}{found.data.matchedBy && <> · показана серия <b className="font-mono text-brand-900">{found.data.matchedBy}</b></>}</> : null)
    : 'Из каталога'
  const panel = variant === 'panel'

  const input = (
    <form role="search" className={cn('flex items-center border bg-white transition-colors', panel ? 'h-16 border-2 border-brand-900 focus-within:border-brand-700' : 'h-12 border-ink-300 focus-within:border-brand-500')} onSubmit={(e) => { e.preventDefault(); if (active >= 0 && items[active]) go(items[active]); else all() }}>
      <Search className={cn('shrink-0 text-ink-500', panel ? 'ml-5 size-6' : 'ml-3 size-5')} aria-hidden />
      <input
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true); setActive(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, items.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)) }
          if (e.key === 'Escape') { setOpen(false); if (panel) onDone?.() }
        }}
        placeholder="Серия (VMP-ДИ), название или обозначение для заказа"
        aria-label="Поиск по каталогу"
        role="combobox"
        aria-expanded={panel || open}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className={cn('h-full min-w-0 flex-1 bg-transparent text-ink-800 placeholder:text-ink-500 focus:outline-none', panel ? 'px-4 text-lg' : 'px-2.5 text-base')}
      />
      {text && panel && (
        <button type="button" onClick={() => { setText(''); setActive(-1) }} className="mr-2 grid size-10 place-items-center rounded-sm text-ink-500 hover:bg-ink-100 hover:text-brand-900" aria-label="Очистить поиск"><X className="size-5" aria-hidden /></button>
      )}
      <button type="submit" className={cn('hidden items-center bg-brand-900 font-medium text-white hover:bg-brand-700 sm:inline-flex', panel ? 'h-full px-7 text-base' : 'mr-1 h-10 px-4 text-[0.9375rem]')}>Найти</button>
    </form>
  )

  const option = (p: ProductSummary, i: number, big: boolean) => (
    <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={big ? 'border-r border-b border-ink-200' : undefined}>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(p)} onMouseEnter={() => setActive(i)}
        className={cn('flex w-full items-center gap-4 text-left transition-colors duration-150', big ? 'h-full p-3' : 'px-4 py-2.5 gap-3', i === active && 'bg-brand-50')}>
        <span className={cn('grid shrink-0 place-items-center bg-white', big ? 'size-16' : 'size-12 border border-ink-100')}>{p.images[0] && <img src={p.images[0]} alt="" className={big ? 'max-h-14 max-w-14 object-contain' : 'max-h-10 max-w-10 object-contain'} />}</span>
        <span className="min-w-0 flex-1">
          <span className={cn('block font-medium text-brand-900', big ? 'leading-snug' : 'truncate')}>{p.name}</span>
          {catName(p.category) && <span className="mt-0.5 block text-sm text-ink-500">{catName(p.category)}</span>}
        </span>
      </button>
    </li>
  )

  if (panel) {
    const empty = searching && found.data && !found.data.total
    return (
      <div className={className}>
        {input}
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_16rem]">
          <div>
            <div className="mb-3 flex min-h-6 items-baseline justify-between gap-4 text-sm text-ink-500" aria-live="polite">
              <span>{status}</span>
              {searching && !!found.data?.total && <button type="button" onClick={all} className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:text-brand-900">Все результаты в каталоге<ArrowRight className="size-4" aria-hidden /></button>}
            </div>
            {empty ? (
              <div role="status" className="border border-ink-200 bg-ink-50 px-5 py-6">
                <p className="font-medium text-brand-900">По запросу «{term}» ничего не нашли</p>
                <p className="mt-1 text-[0.9375rem] text-ink-600">Попробуйте серию (например, VMP-ДИ) или начало обозначения. Если прибора нет в каталоге, изготовим по чертежу или образцу.</p>
              </div>
            ) : (
              <ul id={listId} role="listbox" aria-label={searching ? 'Результаты поиска' : 'Из каталога'} className="grid border-t border-l border-ink-200 sm:grid-cols-2">
                {items.map((p, i) => option(p, i, true))}
              </ul>
            )}
          </div>
          <nav aria-label="Разделы каталога" className="hidden lg:block">
            <p className="mb-3 text-sm text-ink-500">Разделы</p>
            <ul className="border-t border-ink-200">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to="/catalog/$category" params={{ category: c.id }} onClick={onDone} className="flex items-center justify-between gap-3 border-b border-ink-200 py-2.5 text-[0.9375rem] font-medium text-brand-900 hover:text-brand-700">
                    {c.name}<span className="font-mono text-sm font-normal text-ink-500">{c.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false) }}>
      {input}
      {open && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 border border-ink-300 bg-white">
          <p className="border-b border-ink-100 px-4 py-2 text-sm text-ink-500">{status ?? 'Ничего не нашли — попробуйте серию или часть обозначения'}</p>
          {items.length > 0 && (
            <ul id={listId} role="listbox" aria-label={searching ? 'Результаты поиска' : 'Из каталога'}>
              {items.map((p, i) => option(p, i, false))}
            </ul>
          )}
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={all} className="flex w-full items-center justify-between gap-2 border-t border-ink-100 px-4 py-3 text-[0.9375rem] font-medium text-brand-700 hover:bg-brand-50">
            {searching ? 'Все результаты в каталоге' : 'Весь каталог'}<ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
