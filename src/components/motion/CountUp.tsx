import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

/**
 * Числа внутри строки («2100+», «50–300%») набегают от нуля при первом появлении в кадре.
 * Ширина зарезервирована финальным значением, поэтому вёрстка не дёргается.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  const reduce = useReducedMotion()
  const [t, setT] = useState(0)

  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(0, 1, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: setT })
    return () => c.stop()
  }, [inView, reduce])

  const shown = reduce || t >= 1 ? value : value.replace(/\d+/g, (n) => String(Math.round(Number(n) * t)))
  return (
    <span ref={ref} className={`relative inline-block tabular-nums ${className ?? ''}`}>
      <span aria-hidden className="invisible">{value}</span>
      <span aria-hidden className="absolute inset-0">{shown}</span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
