import { motion } from 'motion/react'
import { Children, type ReactNode } from 'react'
import { fadeUp, OFFSET, stagger, VIEWPORT } from '@/lib/motion'

type Props = { children: ReactNode; className?: string; y?: number; delay?: number }

/** Fade + лёгкий подъём при первом появлении в зоне видимости. */
export function Reveal({ children, className, y = OFFSET.md, delay = 0 }: Props) {
  const v = fadeUp(y)
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={VIEWPORT}
      variants={delay ? { ...v, show: { ...(v.show as object), transition: { ...(v.show as { transition: object }).transition, delay } } } : v}>
      {children}
    </motion.div>
  )
}

/** Контейнер сетки/списка: дети (RevealItem) появляются по очереди. */
export function RevealStagger({ children, className, step }: { children: ReactNode; className?: string; step?: number }) {
  return <motion.div className={className} initial="hidden" whileInView="show" viewport={VIEWPORT} variants={stagger(step)}>{Children.map(children, (c) => (c ? <RevealItem>{c}</RevealItem> : null))}</motion.div>
}

export function RevealItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.div className={`h-full [&>*]:h-full [&>a]:block ${className}`} variants={fadeUp(OFFSET.md)}>{children}</motion.div>
}
