import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, statSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import sharp from 'sharp'

export const ROOT = process.cwd()
export const BASE = 'https://vakuummash.ru'
const UA = 'Mozilla/5.0 (data-migration script; contact: saintleroyalle@gmail.com)'
const CACHE = join(ROOT, '.cache')
const LOG = join(CACHE, 'migrate.log')
const MAX_PARALLEL = 2

mkdirSync(join(CACHE, 'http'), { recursive: true })
mkdirSync(join(CACHE, 'files'), { recursive: true })

export const log = (m: string) => appendFileSync(LOG, `${new Date().toISOString()} ${m}\n`)
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const sha = (s: string) => createHash('sha1').update(s).digest('hex')

// ---- вежливый лимитер: ≤2 параллельных запроса, пауза 300–500 мс между стартами ----
let active = 0
let lastStart = 0
const waiters: (() => void)[] = []
async function slot() {
  while (active >= MAX_PARALLEL) await new Promise<void>((r) => waiters.push(r))
  active++
  const wait = lastStart + 300 + Math.random() * 200 - Date.now()
  lastStart = Math.max(Date.now(), lastStart) + Math.max(wait, 0)
  if (wait > 0) await sleep(wait)
}
const release = () => { active--; waiters.shift()?.() }

export const stats = { http: 0, cached: 0, files: 0, failed: [] as string[] }

async function fetchRaw(url: string): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await slot()
    try {
      stats.http++
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, signal: AbortSignal.timeout(60_000) })
      if (res.status === 404 || res.status === 410) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (e) {
      log(`retry ${attempt} ${url}: ${(e as Error).message}`)
      await sleep(1000 * attempt)
    } finally {
      release()
    }
  }
  stats.failed.push(url)
  log(`FAILED ${url}`)
  return null
}

/** Кэшированный GET (текст). Промахи (404) тоже кэшируются. */
export async function get(url: string): Promise<string | null> {
  const f = join(CACHE, 'http', sha(url))
  if (existsSync(f)) { stats.cached++; const t = readFileSync(f, 'utf8'); return t === '\u0000MISS' ? null : t }
  const buf = await fetchRaw(url)
  if (buf === null && stats.failed.includes(url)) return null // сетевой сбой: не кэшируем
  writeFileSync(f, buf ? buf : '\u0000MISS')
  return buf ? buf.toString('utf8') : null
}

export async function wp<T = unknown>(path: string): Promise<T> {
  const t = await get(`${BASE}/wp-json/wp/v2/${path}`)
  if (t === null) throw new Error(`REST недоступен: ${path}`)
  return JSON.parse(t) as T
}

/** Все страницы коллекции REST (per_page=100). */
export async function wpAll<T>(path: string): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; ; page++) {
    const sep = path.includes('?') ? '&' : '?'
    const chunk = await wp<T[]>(`${path}${sep}per_page=100&page=${page}`).catch(() => [] as T[])
    out.push(...chunk)
    if (chunk.length < 100) break
  }
  return out
}

// ---- скачивание файлов ----
const registryFile = join(CACHE, 'assets.json')
const registry: Record<string, { path: string; sizeKb: number }> = existsSync(registryFile) ? JSON.parse(readFileSync(registryFile, 'utf8')) : {}
const taken = new Set(Object.values(registry).map((v) => v.path))
export const saveRegistry = () => writeFileSync(registryFile, JSON.stringify(registry, null, 1))

const TR: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' }
export const slugify = (s: string) =>
  decodeURIComponent(s).toLowerCase().replace(/[а-яё]/g, (c) => TR[c] ?? '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file'

export function absolute(u: string) {
  if (u.startsWith('//')) return 'https:' + u
  if (u.startsWith('/')) return BASE + u
  return u.replace(/^http:\/\//, 'https://')
}
export const isOwn = (u: string) => /^https?:\/\/(www\.)?vakuummash\.ru/i.test(u) || u.startsWith('/')
export const isUpload = (u: string) => /\/wp-content\/uploads\//.test(u)

/** Скачивает файл, картинки уменьшает до 1600 px и конвертирует в webp. Возвращает локальный путь. */
export async function download(rawUrl: string, bucket: string, hint?: string): Promise<{ path: string; sizeKb: number } | null> {
  let url = absolute(rawUrl.trim())
  const cached = registry[url]
  if (cached && existsSync(join(ROOT, 'public', cached.path))) return cached
  const base = url.split('?')[0].split('/').pop() ?? 'file'
  const ext = extname(base).toLowerCase().replace('.', '')
  const isRaster = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'].includes(ext)
  const name = slugify(hint || base.replace(/\.[^.]+$/, ''))
  const outExt = isRaster ? 'webp' : ext || 'bin'
  let rel = `/assets/${bucket}/${name}.${outExt}`
  if (taken.has(rel)) rel = `/assets/${bucket}/${name}-${sha(url).slice(0, 6)}.${outExt}`
  const dest = join(ROOT, 'public', rel)
  const rawFile = join(CACHE, 'files', sha(url))

  let buf: Buffer | null
  if (existsSync(rawFile)) buf = readFileSync(rawFile)
  else {
    // у WP есть миниатюры вида name-300x200.jpg: пробуем оригинал
    const orig = url.replace(/-\d{2,4}x\d{2,4}(\.[a-z]+)$/i, '$1')
    buf = orig !== url ? await fetchRaw(orig) : null
    if (buf) url = orig
    else buf = await fetchRaw(url)
    if (buf) writeFileSync(rawFile, buf)
  }
  if (!buf) { log(`asset missing ${url}`); return null }
  if (!isRaster && /^\s*(<!doctype html|<html)/i.test(buf.subarray(0, 200).toString('utf8'))) { log(`asset is HTML, skipped ${url}`); return null }

  mkdirSync(dirname(dest), { recursive: true })
  if (isRaster) {
    try { await sharp(buf).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest) }
    catch (e) { log(`sharp failed ${url}: ${(e as Error).message}`); return null }
  } else writeFileSync(dest, buf)

  const res = { path: rel, sizeKb: Math.max(1, Math.round(statSync(dest).size / 1024)) }
  registry[absolute(rawUrl.trim())] = res
  registry[url] = res
  taken.add(rel)
  stats.files++
  return res
}

export function writeJson(file: string, data: unknown) {
  const p = join(ROOT, 'src/data', file)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n')
}

let lastLine = 0
export function progress(label: string, i: number, n: number) {
  if (Date.now() - lastLine < 700 && i < n) return
  lastLine = Date.now()
  process.stdout.write(`\r${label}: ${i}/${n}      `)
  if (i >= n) process.stdout.write('\n')
}

export const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&ndash;/g, '–').replace(/\s+/g, ' ').trim()
