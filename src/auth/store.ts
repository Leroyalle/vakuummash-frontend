import { useSyncExternalStore } from 'react'
import { refreshSession, request, setAccessToken, setSessionLostHandler, type AuthPayload } from '@/api/http'
import type { AuthUser } from './types'

export type AuthState = { user: AuthUser | null; ready: boolean }

let state: AuthState = { user: null, ready: false }
const listeners = new Set<() => void>()
const set = (next: AuthState) => {
  state = next
  listeners.forEach((l) => l())
}
const accept = (p: AuthPayload) => {
  setAccessToken(p.accessToken)
  set({ user: p.user, ready: true })
  return p.user
}

setSessionLostHandler(() => set({ user: null, ready: true }))

export const authStore = {
  /** Восстанавливает сессию по refresh-cookie при загрузке приложения. */
  async init() {
    const p = await refreshSession()
    if (p) accept(p)
    else set({ user: null, ready: true })
  },
  async login(email: string, password: string) {
    return accept(await request<AuthPayload>('/auth/login', { method: 'POST', body: { email, password }, noRetry: true }))
  },
  async register(input: { email: string; password: string; name: string; company?: string; phone?: string }) {
    return accept(await request<AuthPayload>('/auth/register', { method: 'POST', body: input, noRetry: true }))
  },
  async logout() {
    await request('/auth/logout', { method: 'POST', noRetry: true }).catch(() => undefined)
    setAccessToken(null)
    set({ user: null, ready: true })
  },
  setUser(user: AuthUser) {
    set({ ...state, user })
  },
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => state,
  )
}
