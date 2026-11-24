import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type RefObject } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * Полоса снизу экрана: появляется, когда карточка с ценой ушла вверх, и держит под рукой «Запросить цену»
 * вместе с собранным обозначением. На телефоне её роль играет нижняя панель «Позвонить / Запросить цену».
 */
export function StickyRequest({ anchor, image, name, code, qty, onRequest }: {
  anchor: RefObject<HTMLElement | null>; image?: string; name: string; code: string; qty: number; onRequest: () => void
}) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = anchor.current
    if (!el) return
    // верх области — под липкой шапкой
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 200), { rootMargin: '-140px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [anchor])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 hidden border-t-4 border-accent-500 bg-brand-800 text-white md:block"
        >
          <div className="container-page flex items-center gap-5 py-3 md:pl-24 min-[1700px]:pl-6">
            {image && <span className="grid size-12 shrink-0 place-items-center bg-white"><img src={image} alt="" className="max-h-10 max-w-10 object-contain" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display font-semibold">{name}</p>
              <p className="truncate font-mono text-sm text-brand-100">{code}{qty > 1 && <span className="ml-3 font-sans">· {qty} шт.</span>}</p>
            </div>
            <Button size="lg" onClick={onRequest} className="shrink-0">Запросить цену</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
