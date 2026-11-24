/** HTTP-клиент: access-токен хранится только в памяти, refresh — в httpOnly-cookie (обновляется один раз на пачку 401). */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')
/** Публичный адрес бакета: нужен админке для превью путей вида `/assets/...`. */
let mediaBase = (import.meta.env.VITE_MEDIA_URL ?? 'http://localhost:9000/vakuummash').replace(/\/$/, '')
/** Адрес хранилища берётся у сервера при старте (`/api/config`), поэтому смена S3/CDN не требует пересборки фронтенда. */
export async function loadPublicConfig() {
  try {
    const res = await fetch(`${API_URL}/config`)
    if (res.ok) mediaBase = ((await res.json()) as { mediaUrl: string }).mediaUrl.replace(/\/$/, '')
  } catch { /* остаётся значение из сборки */ }
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
  }
}

type Listener = () => void
let accessToken: string | null = null
let onSessionLost: Listener = () => {}
export const setAccessToken = (t: string | null) => { accessToken = t }
export const setSessionLostHandler = (fn: Listener) => { onSessionLost = fn }

type Opts = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number | boolean | undefined | null>
  body?: unknown
  form?: FormData
  /** без автообновления токена (login/refresh) */
  noRetry?: boolean
}

function url(path: string, query?: Opts['query']) {
  const u = new URL(`${API_URL}${path}`, window.location.origin)
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v))
  return u.toString()
}

async function send(path: string, o: Opts): Promise<Response> {
  const headers: Record<string, string> = {}
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (o.body !== undefined) headers['Content-Type'] = 'application/json'
  return fetch(url(path, o.query), {
    method: o.method ?? 'GET',
    headers,
    credentials: 'include',
    body: o.form ?? (o.body !== undefined ? JSON.stringify(o.body) : undefined),
  })
}

export type AuthPayload = { accessToken: string; user: import('@/auth/types').AuthUser }

let refreshing: Promise<AuthPayload | null> | null = null
/** Обновляет access-токен по refresh-cookie; параллельные вызовы делят один запрос. */
export function refreshSession(): Promise<AuthPayload | null> {
  refreshing ??= (async () => {
    try {
      const res = await send('/auth/refresh', { method: 'POST' })
      if (!res.ok) return null
      const data = (await res.json()) as AuthPayload
      accessToken = data.accessToken
      return data
    } catch {
      return null
    } finally {
      setTimeout(() => { refreshing = null }, 0)
    }
  })()
  return refreshing
}

export async function request<T>(path: string, o: Opts = {}): Promise<T> {
  let res = await send(path, o)
  if (res.status === 401 && !o.noRetry && accessToken) {
    const next = await refreshSession()
    if (next) res = await send(path, o)
    else {
      accessToken = null
      onSessionLost()
    }
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[]; code?: string } | null
    const msg = Array.isArray(body?.message) ? body.message.join('; ') : body?.message
    throw new ApiError(res.status, msg ?? `Ошибка ${res.status}`, body?.code)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

/** Превью файла по пути из БД (`/assets/...`). */
export const mediaUrl = (path: string | null | undefined) =>
  !path ? '' : /^https?:\/\//.test(path) ? path : `${mediaBase}/${path.replace(/^\/assets\//, '').replace(/^\//, '')}`
