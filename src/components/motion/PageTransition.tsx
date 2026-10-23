import { useRouterState } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { OFFSET, t } from '@/lib/motion'

/** Короткое появление контента при смене страницы (без exit-анимации, чтобы не было двойного мерцания). Ключ — путь без query/hash. */
export function PageTransition({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname })
  return (
    <motion.div key={path} initial={{ opacity: 0, y: OFFSET.sm }} animate={{ opacity: 1, y: 0 }} transition={t('fast')}>
      {children}
    </motion.div>
  )
}
