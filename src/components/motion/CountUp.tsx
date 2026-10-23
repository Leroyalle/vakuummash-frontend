import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { DUR, EASE } from '@/lib/motion'

/** Число, «набегающее» при появлении. Ширина зарезервирована финальным значением, поэтому вёрстка не дёргается. */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduce = useReducedMotion()
  const match = /^(\D*)(\d[\d\s]*)(.*)$/.exec(value)
  const target = match ? Number(match[2].replace(/\s/g, '')) : NaN
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView || reduce || Number.isNaN(target)) return
    const c = animate(0, target, { duration: DUR.slow * 2, ease: EASE, onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [inView, reduce, target])

  const shown = Number.isNaN(target) || reduce || !inView || n >= target ? value : `${match![1]}${n.toLocaleString('ru-RU')}${match![3]}`
  return (
    <span ref={ref} className={`relative inline-block tabular-nums ${className ?? ''}`}>
      <span aria-hidden className="invisible">{value}</span>
      <span className="absolute inset-0">{shown}</span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
