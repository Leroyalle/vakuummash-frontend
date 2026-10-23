import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { OFFSET, t } from '@/lib/motion'

/** Кнопка «Наверх»: появляется после первого экрана. */
export function ToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <AnimatePresence>
      {show && (
        <motion.button type="button" aria-label="Наверх" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, y: OFFSET.md }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: OFFSET.sm }} transition={t('fast')}
          className="fixed bottom-4 left-4 z-40 grid size-11 place-items-center rounded-full border border-ink-200 bg-white text-brand-900 shadow-md hover:text-accent-700 md:bottom-6 md:left-6">
          <ArrowUp className="size-5" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
