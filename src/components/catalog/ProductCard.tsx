import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { ArrowRight } from 'lucide-react'
import { PRICE_MODE } from '@/config'
import type { Product } from '@/data/types'
import { rub } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { Sensor } from '@/components/illustrations/Sensor'
import { Skeleton } from '@/components/ui/Skeleton'

export function ProductImage({ p, className }: { p: Product; className?: string }) {
  return p.images[0] ? (
    <img src={p.images[0]} alt={p.name} loading="lazy" className={cn('object-contain', className)} />
  ) : (
    <Sensor category="pressure" className={className} label={p.name} />
  )
}

/** Галерея карточки: на десктопе кадр выбирается положением курсора, на touch — свайп (scroll-snap). */
function CardGallery({ p, to }: { p: Product; to: { category: string; productId: string } }) {
  const imgs = p.images
  const [idx, setIdx] = useState(0)
  const [armed, setArmed] = useState(false)
  const touch = useMediaQuery('(hover: none)')
  const n = imgs.length

  const preload = () => {
    if (armed) return
    setArmed(true)
    imgs.slice(1).forEach((src) => { const i = new Image(); i.src = src })
  }
  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setIdx(Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n))))
  }
  const bars = (cls: string) => (
    <div aria-hidden className={`pointer-events-none absolute inset-x-3 bottom-2 flex gap-1 ${cls}`}>
      {imgs.map((_, i) => <span key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-150 ${i === idx ? 'bg-accent-500' : 'bg-ink-300'}`} />)}
    </div>
  )

  if (n <= 1) return <div className="relative h-40 overflow-hidden bg-white"><ProductImage p={p} className="absolute inset-3 size-[calc(100%-1.5rem)] object-contain" /></div>

  if (touch) {
    return (
      <div className="relative bg-white">
        <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {imgs.map((src, i) => (
            <Link key={src} {...{ to: '/catalog/$category/$productId', params: to }} className="relative block h-40 w-full shrink-0 snap-center overflow-hidden" aria-label={p.name} tabIndex={i ? -1 : 0}>
              <img src={src} alt={i === 0 ? p.name : ''} loading="lazy" className="absolute inset-3 size-[calc(100%-1.5rem)] object-contain" />
            </Link>
          ))}
        </div>
        {bars('')}
      </div>
    )
  }
  return (
    <Link {...{ to: '/catalog/$category/$productId', params: to }} aria-hidden tabIndex={-1} className="relative z-[1] block h-40 overflow-hidden bg-white" onMouseEnter={preload} onMouseMove={onMove} onMouseLeave={() => setIdx(0)}>
      {imgs.map((src, i) => (i === 0 || armed) && (
        <img key={src} src={src} alt={i === 0 ? p.name : ''} loading={i === 0 ? 'lazy' : 'eager'}
          className={`absolute inset-3 size-[calc(100%-1.5rem)] object-contain transition-opacity duration-150 ${i === idx ? 'opacity-100' : 'opacity-0'}`} />
      ))}
      {bars('opacity-0 transition-opacity duration-150 group-hover:opacity-100')}
    </Link>
  )
}

export function ProductCard({ p, layout = 'grid' }: { p: Product; layout?: 'grid' | 'list' }) {
  const showPrice = PRICE_MODE === 'show' && p.price !== null
  return (
    <article className={cn('group relative flex overflow-hidden rounded-md border border-ink-200 bg-white transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg', layout === 'grid' ? 'flex-col' : 'flex-col sm:flex-row')}>
      <div className={cn(layout === 'list' && 'sm:w-56 sm:shrink-0')}><CardGallery p={p} to={{ category: p.category, productId: p.id }} /></div>
      <div className="flex flex-1 flex-col border-t border-ink-100 p-5">
        {p.badges.length > 0 && <div className="mb-2 flex flex-wrap gap-1.5">{p.badges.map((b) => <Badge key={b} tone={b === 'Ex' ? 'accent' : 'brand'}>{b}</Badge>)}</div>}
        <h3 className="text-base leading-snug">
          <Link to="/catalog/$category/$productId" params={{ category: p.category, productId: p.id }} className="after:absolute after:inset-0 after:z-0 hover:text-accent-700">{p.name}</Link>
        </h3>
        <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-ink-600">{p.short}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-brand-900">{showPrice ? rub(p.price!) : 'Цена по запросу'}</span>
          <span className="flex items-center gap-1 text-sm text-accent-600">
            <span className="translate-x-1 opacity-0 transition duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">Подробнее</span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  )
}

export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-md border border-ink-200"><Skeleton className="h-44 rounded-none" /><div className="space-y-3 p-5"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-5 w-4/5" /><Skeleton className="h-10 w-full" /></div></div>
)
