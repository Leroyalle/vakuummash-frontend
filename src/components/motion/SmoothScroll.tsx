import Lenis from 'lenis'
import { useEffect } from 'react'

/** Мягкий скролл: только мышь/трекпад на десктопе и без prefers-reduced-motion. Иначе — нативный скролл. */
export function SmoothScroll() {
  useEffect(() => {
    const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lenis: Lenis | null = null
    let raf = 0
    const tick = (time: number) => { lenis?.raf(time); raf = requestAnimationFrame(tick) }
    const sync = () => {
      const on = mqFine.matches && !mqReduce.matches
      if (on && !lenis) { lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: true }); raf = requestAnimationFrame(tick) }
      if (!on && lenis) { cancelAnimationFrame(raf); lenis.destroy(); lenis = null }
    }
    sync()
    mqFine.addEventListener('change', sync); mqReduce.addEventListener('change', sync)
    return () => { mqFine.removeEventListener('change', sync); mqReduce.removeEventListener('change', sync); cancelAnimationFrame(raf); lenis?.destroy() }
  }, [])
  return null
}
