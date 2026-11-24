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

/** Пропсы для списка/сетки: дети с `variants={item}` появляются по очереди, когда список входит в кадр. */
export const revealList = (step = 0.07) => ({ initial: 'hidden', whileInView: 'show', viewport: VIEWPORT, variants: stagger(step) }) as const
/** Элемент списка: подъём с проявлением. */
export const item: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }
/** Текст поднимается из-под маски (родитель — `overflow-hidden`). */
export const rise = (delay = 0): Variants => ({ hidden: { y: '105%' }, show: { y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay } } })
