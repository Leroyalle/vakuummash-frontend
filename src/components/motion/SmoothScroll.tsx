import { useRouterState } from '@tanstack/react-router'
import Lenis from 'lenis'
import { useEffect, useRef } from 'react'

/** Мягкий скролл: только мышь/трекпад на десктопе и без prefers-reduced-motion. Иначе — нативный скролл. */
export function SmoothScroll() {
  const instance = useRef<Lenis | null>(null)
  const path = useRouterState({ select: (s) => s.location.pathname })
  const hash = useRouterState({ select: (s) => s.location.hash })
  const popped = useRef(false)

  useEffect(() => {
    const onPop = () => { popped.current = true }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // новая страница открывается сверху; «Назад» и переходы к якорю не трогаем
  useEffect(() => {
    if (popped.current) { popped.current = false; return }
    if (hash) return
    instance.current?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
  }, [path, hash])

  useEffect(() => {
    const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lenis: Lenis | null = null
    let raf = 0
    const tick = (time: number) => { lenis?.raf(time); raf = requestAnimationFrame(tick) }
    const sync = () => {
      const on = mqFine.matches && !mqReduce.matches
      if (on && !lenis) { lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: true }); instance.current = lenis; raf = requestAnimationFrame(tick) }
      if (!on && lenis) { cancelAnimationFrame(raf); lenis.destroy(); lenis = null; instance.current = null }
    }
    sync()
    mqFine.addEventListener('change', sync); mqReduce.addEventListener('change', sync)
    return () => { mqFine.removeEventListener('change', sync); mqReduce.removeEventListener('change', sync); cancelAnimationFrame(raf); lenis?.destroy() }
  }, [])
  return null
}
