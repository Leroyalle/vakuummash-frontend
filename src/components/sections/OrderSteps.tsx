import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * «Как заказать»: оранжевая линия процесса идёт за прокруткой и «включает» шаги по мере прохождения.
 * На узких экранах шаги в колонку — там линия вертикальная.
 */
export function OrderSteps({ steps }: { steps: { t: string; d: string }[] }) {
  const ref = useRef<HTMLOListElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 55%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  const [reached, setReached] = useState(reduce ? steps.length : 0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!reduce) setReached(p <= 0 ? 0 : Math.min(steps.length, Math.floor(p * (steps.length - 1) + 1.0001)))
  })

  return (
    <ol ref={ref} className="relative mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      <span aria-hidden className="absolute top-7 right-0 left-0 hidden h-1 bg-ink-200 lg:block" />
      <motion.span aria-hidden style={{ scaleX: reduce ? 1 : progress }} className="absolute top-7 right-0 left-0 hidden h-1 origin-left bg-accent-500 lg:block" />
      {steps.map((st, i) => {
        const on = i < reached
        return (
          <li key={st.t} className="relative">
            <span className={cn('relative grid size-14 place-items-center border-2 font-display text-2xl font-bold ring-8 ring-white transition-colors duration-500',
              on ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300 bg-white text-ink-500')}>
              {i + 1}
            </span>
            <h3 className={cn('mt-5 text-xl transition-colors duration-500', !on && 'text-ink-600')}>{st.t}</h3>
            <p className="mt-2 max-w-[19rem] text-[1.0625rem] leading-relaxed text-ink-700">{st.d}</p>
          </li>
        )
      })}
    </ol>
  )
}
