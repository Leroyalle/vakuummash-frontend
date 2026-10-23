import { appendFileSync, mkdirSync } from 'node:fs'

mkdirSync('.cache', { recursive: true })
export const log = (m: string) => appendFileSync('.cache/structure.log', m + '\n')

export const toText = (h: string) =>
  h.replace(/<img[^>]*>/g, '').replace(/<\/(tr|p|li|h\d)>/g, '\n').replace(/<\/t[dh]>/g, ' | ').replace(/<br>/g, ' / ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
export const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/\s*[|/]\s*$/, '').trim()

/** Строки таблицы «параметр | значение» (первое значение побеждает). Многострочные значения склеиваются. */
export function tableRows(t: string): Record<string, string> {
  const rows: Record<string, string> = {}
  for (const m of t.matchAll(/^([^|\n]{3,90}?)\s*\|\s*([^|\n]+(?:\n(?![^|\n]*\|)[^|\n]*)*)\|/gm)) {
    const k = clean(m[1]).replace(/:$/, '')
    if (!/^VMP/.test(k) && !(k in rows)) rows[k] = clean(m[2])
  }
  return rows
}

/** «0…40; 25; 16 кПа» → ['0…40 кПа','0…25 кПа','0…16 кПа'] */
export function parseRanges(s: string): string[] {
  const m = /^(.*?)\s*(кПа|МПа|Па|бар|кгс\/см2?)\s*$/.exec(clean(s))
  if (!m) return []
  const items = m[1].split(';').map((x) => x.trim()).filter(Boolean)
  const prefix = /^(.*?…)/.exec(items[0])?.[1] ?? ''
  return items.map((x) => `${x.includes('…') ? x : prefix + x} ${m[2]}`.replace(/\s+/g, ' '))
}

export const optValue = (label: string) => label.replace(/,/g, '.').replace(/[\s:]+/g, '')

/** «C06; 07; 08: 09; 10» → ['C06','C07','C08','C09','C10'] */
export function expandCodes(s: string): string[] {
  const parts = s.split(/[;:]/).map((x) => x.trim()).filter(Boolean)
  const lead = /^[A-Za-zА-Яа-я]+/.exec(parts[0])?.[0] ?? ''
  return parts.map((p) => (/^\d+$/.test(p) ? lead + p : p))
}

export const normSignal = (s: string) =>
  clean(s).replace(/(\d)\s*мА/g, '$1 мА').replace(/\s*\+\s*/g, ' + ').replace(/RS\s*-?\s*485/gi, 'RS-485').replace(/^[Аа]налоговый\s+/, '').replace(/\s+/g, ' ')

const LAT: Record<string, string> = { А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X' }
/** Кириллические «двойники» в кодах → латиница (P01А и Р01А — один код). */
export const latin = (s: string) => s.replace(/[АВЕКМНОРСТХ]/g, (c) => LAT[c]).replace(/[*\s]+$/g, '')
