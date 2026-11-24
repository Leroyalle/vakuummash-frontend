import { useRouterState } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** Мягкое проявление контента при смене страницы: только opacity (без сдвигов — нет прыжков вёрстки и мерцания). Ключ — путь без query/hash. */
export function PageTransition({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname })
  return (
    <motion.div key={path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}
