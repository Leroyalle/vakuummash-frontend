import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { q } from '@/api/queries'
import { useCategories } from '@/api/useCategories'
import type { ProductSummary } from '@/data/types'
import { cn } from '@/lib/cn'

/**
 * Поиск по каталогу с подсказками: пустое поле — популярные товары, от 2 символов — совпадения
 * (в том числе по полному обозначению для заказа). Стрелки ↑↓ выбирают, Enter открывает, Esc закрывает.
 */
export function SearchBox({ className, onDone, autoFocus }: { className?: string; onDone?: () => void; autoFocus?: boolean }) {
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
  const items: ProductSummary[] = searching ? (found.data?.items ?? []) : (popular.data ?? []).slice(0, 6)
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

  return (
    <div className={cn('relative', className)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <form role="search" className="flex h-12 items-center border border-ink-300 bg-white focus-within:border-brand-500" onSubmit={(e) => { e.preventDefault(); if (active >= 0 && items[active]) go(items[active]); else all() }}>
        <Search className="ml-3 size-5 shrink-0 text-ink-500" aria-hidden />
        <input
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); setActive(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, items.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)) }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder="Серия (VMP-ДИ, ТПП), название или обозначение"
          aria-label="Поиск по каталогу"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-base text-ink-800 placeholder:text-ink-500 focus:outline-none"
        />
        <button type="submit" className="mr-1 hidden h-10 items-center bg-brand-900 px-4 text-[0.9375rem] font-medium text-white hover:bg-brand-700 sm:inline-flex">Найти</button>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 border border-ink-300 bg-white">
          <p className="border-b border-ink-100 px-4 py-2 text-sm text-ink-500">
            {searching ? (found.isFetching && !found.data ? 'Ищем…' : found.data?.total ? <>Найдено: {found.data.total}{found.data.matchedBy && <> · показана серия <b className="font-mono text-brand-900">{found.data.matchedBy}</b></>}</> : 'Ничего не нашли — попробуйте серию или часть обозначения') : 'Популярные товары'}
          </p>
          {items.length > 0 && (
            <ul id={listId} role="listbox" aria-label={searching ? 'Результаты поиска' : 'Популярные товары'}>
              {items.map((p, i) => (
                <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(p)} onMouseEnter={() => setActive(i)}
                    className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors', i === active && 'bg-brand-50')}>
                    <span className="grid size-12 shrink-0 place-items-center border border-ink-100 bg-white">{p.images[0] && <img src={p.images[0]} alt="" className="max-h-10 max-w-10 object-contain" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-brand-900">{p.name}</span>
                      {catName(p.category) && <span className="block text-sm text-ink-500">{catName(p.category)}</span>}
                    </span>
                  </button>
                </li>
              ))}
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
