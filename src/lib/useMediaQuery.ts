import { useSyncExternalStore } from 'react'

/** Подписка на media query без эффектов; на сервере/в тестах — false. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
