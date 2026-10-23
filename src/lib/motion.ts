import type { Transition, Variants } from 'motion/react'

/** Единые токены анимации. Всё остальное берёт значения отсюда. */
export const DUR = { fast: 0.15, base: 0.3, slow: 0.55 } as const
export const EASE = [0.22, 1, 0.36, 1] as const
export const OFFSET = { sm: 8, md: 16, lg: 24 } as const
export const STAGGER = 0.055
/** Появление при скролле: один раз, с отступом от края окна. */
export const VIEWPORT = { once: true, margin: '-80px' } as const

export const t = (d: keyof typeof DUR = 'base', delay = 0): Transition => ({ duration: DUR[d], ease: EASE, delay })

export const fadeUp = (y: number = OFFSET.md): Variants => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: t('base') },
})

export const stagger = (step = STAGGER, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren } },
})
