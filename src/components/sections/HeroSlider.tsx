import { Link } from '@tanstack/react-router'
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'
import { A11y, Autoplay, EffectCoverflow, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperT } from 'swiper/types'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import { useCategories } from '@/api/useCategories'
import { useModals } from '@/components/forms/ModalsContext'
import type { ProductSummary } from '@/data/types'

const DELAY = 3200
const pad = (n: number) => String(n).padStart(2, '0')
const nb = (s: string) => s.replace(/-/g, '‑')

/** Слайдер товаров первого экрана: Swiper coverflow, соседние карточки повёрнуты и прижаты к центральной. */
export function HeroSlider({ items }: { items: ProductSummary[] }) {
  const { openPrice } = useModals()
  const { categories } = useCategories()
  const swiper = useRef<SwiperT | null>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const [index, setIndex] = useState(0)
  const reduce = useReducedMotion()
  const [playing, setPlaying] = useState(!reduce)
  const n = items.length

  if (!n) return <div className="h-[26rem] w-full animate-pulse bg-white/10" />

  const p = items[index] ?? items[0]
  const link = { to: '/catalog/$category/$productId', params: { category: p.category, productId: p.id } } as const
  const toggle = () => {
    const s = swiper.current
    if (!s?.params.autoplay) return
    if (playing) s.autoplay.stop()
    else s.autoplay.start()
    setPlaying(!playing)
  }

  return (
    <div className="min-w-0" aria-roledescription="карусель" aria-label="Продукция завода">
      <Swiper
        modules={[Autoplay, EffectCoverflow, Keyboard, A11y]}
        onSwiper={(s) => { swiper.current = s }}
        onSlideChange={(s) => setIndex(s.realIndex)}
        onAutoplayTimeLeft={(_, __, progress) => bar.current?.style.setProperty('transform', `scaleX(${1 - progress})`)}
        effect="coverflow"
        centeredSlides
        slidesPerView="auto"
        loop={n > 3}
        speed={650}
        grabCursor
        slideToClickedSlide
        keyboard={{ enabled: true }}
        autoplay={reduce ? false : { delay: DELAY, disableOnInteraction: false }}
        coverflowEffect={{ rotate: 38, stretch: 30, depth: 140, modifier: 1, slideShadows: true }}
        a11y={{ prevSlideMessage: 'Предыдущий товар', nextSlideMessage: 'Следующий товар', slideLabelMessage: '{{index}} из {{slidesLength}}' }}
        className="hero-coverflow !py-2"
      >
        {items.map((x) => (
          <SwiperSlide key={x.id} className="!w-[56%] sm:!w-[48%]">
            <div className="aspect-[4/5] bg-white p-5">
              {x.images[0] && <img src={x.images[0]} alt={x.name} className="size-full object-contain" draggable={false} />}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* подпись активного товара и управление */}
      <div className="relative z-10 mt-6 border-t border-white/20 pt-4">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1" aria-live="polite">
            {categories.find((c) => c.id === p.category) && <p className="text-sm text-brand-100">{categories.find((c) => c.id === p.category)?.name}</p>}
            <Link {...link} className="mt-0.5 block text-balance font-display text-xl font-bold leading-snug text-white hover:text-brand-100">{nb(p.name)}</Link>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
              <Link {...link} className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-white underline-offset-4 hover:underline">Подобрать модификацию<ArrowRight className="size-4" aria-hidden /></Link>
              <button type="button" onClick={() => openPrice({ product: p.name })} className="font-medium text-brand-100 underline underline-offset-4 hover:text-white">Узнать цену</button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-sm text-brand-100"><span className="text-white">{pad(index + 1)}</span> / {pad(n)}</span>
          <span className="relative h-0.5 flex-1 overflow-hidden bg-white/20" aria-hidden>
            <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-accent-500" />
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={toggle} aria-label={playing ? 'Остановить прокрутку' : 'Включить прокрутку'} className="grid size-10 place-items-center text-brand-100 hover:text-white">
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            </button>
            <button type="button" aria-label="Предыдущий товар" onClick={() => swiper.current?.slidePrev()} className="grid size-10 place-items-center border border-white/40 text-white transition-colors hover:bg-white hover:text-brand-900"><ChevronLeft className="size-5" aria-hidden /></button>
            <button type="button" aria-label="Следующий товар" onClick={() => swiper.current?.slideNext()} className="grid size-10 place-items-center border border-white/40 text-white transition-colors hover:bg-white hover:text-brand-900"><ChevronRight className="size-5" aria-hidden /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
