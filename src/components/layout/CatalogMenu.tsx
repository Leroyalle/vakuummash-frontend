import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { q } from '@/api/queries'
import { useCategories } from '@/api/useCategories'
import { useModals } from '@/components/forms/ModalsContext'
import { cn } from '@/lib/cn'

/**
 * Выпадающее меню каталога: слева разделы, справа товары раздела под курсором.
 * Каталог небольшой, поэтому товары берём одним запросом и группируем на месте.
 */
export function CatalogMenu({ onClose }: { onClose: () => void }) {
  const { categories } = useCategories()
  const { openPrice } = useModals()
  const products = useQuery(q.products({ perPage: 60 })).data?.items ?? []
  const [picked, setPicked] = useState<string | null>(null)
  const current = categories.find((c) => c.id === picked) ?? categories[0]
  const items = products.filter((p) => p.category === current?.id)
  const total = categories.reduce((n, c) => n + c.count, 0)

  return (
    <div id="mega" className="animate-pop-in absolute inset-x-0 top-full z-10 border-t border-ink-200 border-b-4 border-b-brand-500 bg-white">
      <div className="bg-[linear-gradient(to_right,var(--color-brand-50)_50%,white_50%)]">
      <div className="container-page grid grid-cols-[minmax(17rem,22rem)_1fr]">
        <nav aria-label="Разделы каталога" className="border-r border-brand-100 bg-brand-50 py-6 pr-6">
          <ul className="space-y-0.5">
            {categories.map((c) => {
              const on = c.id === current?.id
              return (
                <li key={c.id}>
                  <Link
                    to="/catalog/$category" params={{ category: c.id }}
                    onMouseEnter={() => setPicked(c.id)} onFocus={() => setPicked(c.id)}
                    className={cn('flex items-center justify-between gap-4 rounded-sm px-4 py-3 font-display text-lg font-medium transition-colors duration-150',
                      on ? 'bg-brand-500 text-white' : 'text-brand-900 hover:bg-white')}
                  >
                    {c.name}
                    <span className={cn('font-mono text-sm', on ? 'text-white/80' : 'text-ink-500')}>{c.count}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <Link to="/catalog" className="mt-4 flex items-center justify-between gap-4 border-t border-brand-100 px-4 pt-4 font-display text-lg font-semibold text-brand-700 hover:text-brand-900">
            Весь каталог<span className="flex items-center gap-2 font-mono text-sm font-normal text-ink-500">{total}<ArrowRight className="size-4 text-brand-700" aria-hidden /></span>
          </Link>
        </nav>

        <div className="min-h-[20rem] bg-white py-6 pl-8">
          {current && (
            <>
              <div className="mb-4 flex items-baseline justify-between gap-6">
                <p className="font-display text-xl font-semibold text-brand-900">{current.name}</p>
                <Link to="/catalog/$category" params={{ category: current.id }} className="inline-flex shrink-0 items-center gap-1.5 text-[0.9375rem] font-medium text-brand-700 hover:text-brand-900">
                  Все товары раздела<ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              <ul key={current.id} className="animate-fade-in grid grid-cols-2 border-t border-l border-ink-200 2xl:grid-cols-3">
                {items.map((p) => (
                  <li key={p.id} className="border-r border-b border-ink-200">
                    <Link to="/catalog/$category/$productId" params={{ category: p.category, productId: p.id }} className="group flex h-full items-center gap-4 p-3 transition-colors duration-150 hover:bg-brand-50">
                      <span className="grid size-16 shrink-0 place-items-center bg-white">
                        {p.images[0] && <img src={p.images[0]} alt="" className="max-h-14 max-w-14 object-contain" />}
                      </span>
                      <span className="text-[0.9375rem] leading-snug font-medium text-brand-900 group-hover:text-brand-700">{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      </div>
      <div className="bg-brand-800 text-white">
        <div className="container-page flex items-center justify-between gap-6 py-3 text-[0.9375rem]">
          <span className="text-brand-100">Не нашли нужное? Изготовим по техническому заданию или чертежу.</span>
          <button type="button" onClick={() => { onClose(); openPrice() }} className="inline-flex items-center gap-1.5 font-medium text-white underline-offset-4 hover:underline">
            Запрос на подбор<ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
