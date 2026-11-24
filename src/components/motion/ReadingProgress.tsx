import { motion, useScroll, useSpring } from 'motion/react'

/** Тонкая полоса прогресса чтения (2 px) — только для длинных страниц. */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 })
  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[55] h-[2px] origin-left bg-accent-500" />
}
