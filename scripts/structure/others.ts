import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { MigratedProduct } from '../../src/data/schema'
import type { ConfigFile } from '../../src/data/structure-schema'
import { clean, latin, optValue, tableRows, toText } from './common'

export type Page = { slug: string; name: string; sub: string | null; category: string; text: string; rows: Record<string, string>; attrs: Record<string, string[]>; images: string[]; html: string }
export type SourceMod = Record<string, string>
export type BuiltFamily = { id: string; name: string; category: string; pages: Page[]; config: ConfigFile | null; sourceMods: SourceMod[]; anomalies: string[]; free: string[] }
type Opt = ConfigFile['fields'][number]['options'][number]

export const loadPages = (): Page[] =>
  z.array(MigratedProduct).parse(JSON.parse(readFileSync('src/data/products.json', 'utf8')))
    .filter((p) => p.rootCategory !== 'datchiki-davleniya')
    .map((p) => {
      const text = toText(p.html)
      const sub = JSON.parse(readFileSync('src/data/categories.json', 'utf8')).find((c: { kind: string; id: number }) => c.kind === 'product' && p.categoryIds.includes(c.id) && c.id !== undefined && [75, 76, 78, 79, 81, 90].includes(c.id))?.slug ?? null
      return { slug: p.slug, name: p.name, sub, category: p.rootCategory, text, rows: tableRows(text), attrs: Object.fromEntries(p.attributes.map((a) => [a.name, a.values])), images: p.images, html: p.html }
    })

const exFix = (s: string) => s.replace(/[ЕE][хx]/g, 'Ex').replace(/Ех/g, 'Ex')
const KIND_EX = (name: string, text: string) => {
  const n = exFix(name)
  const set = new Set<string>()
  if (/Exi/.test(n)) set.add('Exi')
  if (/Exd/.test(n)) set.add('Exd')
  if (!set.size || /общепромышленн/i.test(text)) set.add('none')
  return ['none', 'Exi', 'Exd'].filter((x) => set.has(x))
}
const EXOPT: Record<string, Opt> = {
  none: { value: 'none', label: 'Без взрывозащиты', codePart: '' },
  Exi: { value: 'Exi', label: 'Ex i (искробезопасная цепь)', codePart: 'Exi' },
  Exd: { value: 'Exd', label: 'Ex d (взрывонепроницаемая оболочка)', codePart: 'Exd' },
}

/** «ТПС 303, 304 (Exi)» → ['ТПС 303','ТПС 304'];  «…-01, -011» → ['…-01','…-011'] */
export function modelsOf(name: string): string[] {
  const base = clean(exFix(name).replace(/\/\s+/g, '/').replace(/\((?:[^()]*Ex[^()]*)\)/g, '').replace(/\bExd\b|\bExi\b/g, '').replace(/\(исполнени[^)]*\)?/g, ''))
  const parts = base.split(/\s*,\s*/).filter(Boolean)
  if (parts.length < 2) return [base]
  const first = parts[0]
  return parts.map((p, i) => {
    if (i === 0) return p
    if (/^-?\d+[А-Яа-яA-Za-z]?\s*[А-Яа-я]?$/.test(p)) { const lead = first.replace(/[-.\s]?\d+[А-Яа-яA-Za-z]*(?:\s*[А-Яа-я])?$/, ''); return `${lead}${/[-.\s]\d+[А-Яа-яA-Za-z]*$/.exec(first)?.[0].charAt(0) ?? ' '}${p.replace(/^-/, '')}` }
    return p
  })
}

/** Группа: свойства «модель × исполнение» (+ списки длин/диаметров/материалов, если найдены). */
export function buildTemperature(pages: Page[]): BuiltFamily[] {
  const FAM: Record<string, { id: string; name: string }> = {
    'termopreobrazovateli-soprotivleniya-tps': { id: 'tps', name: 'Термопреобразователи сопротивления ТПС' },
    'termopreobrazovateli-kabelnye-tha-k-thk-k-tnn-tzhk': { id: 'tha-k', name: 'Термопреобразователи кабельные ТХА-К / ТХК-К / ТНН / ТЖК' },
    'preobrazovateli-termoelektricheskie-thav-thkv': { id: 'thav-thkv', name: 'Преобразователи термоэлектрические ТХАв / ТХКв' },
    'preobrazovateli-termoelektricheskie-tpp-tpr': { id: 'tpp-tpr', name: 'Преобразователи термоэлектрические ТПП / ТПР' },
    'termopreobrazovateli-s-unifitsirovannym-vykhodnym-signalom-datchiki-temperatury': { id: 'utp', name: 'Термопреобразователи с унифицированным выходным сигналом УТП' },
    'termopreobrazovateli-mnogozonnye': { id: 'tpm', name: 'Термопреобразователи многозонные ТПМ' },
  }
  const groups = new Map<string, Page[]>()
  for (const p of pages.filter((x) => x.category === 'datchiki-temperatury')) groups.set(p.sub ?? 'other', [...(groups.get(p.sub ?? 'other') ?? []), p])
  return [...groups].map(([sub, list]) => {
    const anomalies: string[] = []; const free: string[] = []
    const meta = FAM[sub] ?? { id: `t-${sub}`, name: sub }
    const modelPage = new Map<string, Page>()
    const perModel = new Map<string, { ex: string[]; L: string[]; d: string[]; mat: string[]; nsh: string[]; range: string[]; sig: string[] }>()
    const mods: string[] = []
    for (const p of list) {
      const ms = modelsOf(p.name); const ex = KIND_EX(p.name, p.text)
      const L = (/(\d{2,4}(?:,\s*\d{2,4}){3,})/.exec(p.text.replace(/\s*\/\s*\n/g, ' ').replace(/\n/g, ' '))?.[1] ?? '').split(/,\s*/).filter(Boolean)
      const d = (/(\d+(?:,\d+)?(?:;\s*\d+(?:,\d+)?){1,})/.exec(p.text)?.[1] ?? '').split(/;\s*/).filter(Boolean)
      const mat = [...new Set([...p.text.matchAll(/\b([СCТT]\d{2,3}|Бк\d+)\b/g)].map((m) => latin(m[1])))]
      for (const m of ms) {
        const cur = { ex, L, d, mat, nsh: p.attrs['НСХ'] ?? [], range: p.attrs['Диапазон раб.темп.'] ?? [], sig: p.attrs['Выходной сигнал'] ?? [] }
        const prev = perModel.get(m)
        if (prev) { for (const k of Object.keys(cur) as (keyof typeof cur)[]) prev[k] = [...new Set([...prev[k], ...cur[k]])] }
        else { modelPage.set(m, p); mods.push(m); perModel.set(m, cur) }
      }
      if (!L.length) free.push(`${p.name}: длины монтажной части не найдены — поле не ограничено`)
    }
    const uniq = <T,>(f: (v: NonNullable<ReturnType<typeof perModel.get>>) => T[]) => [...new Set([...perModel.values()].flatMap(f))]
    const mk = (id: string, label: string, vals: string[], codeOf: (v: string) => string, labelOf = (v: string) => v): ConfigFile['fields'][number] | null =>
      vals.length ? { id, label, default: optValue(vals[0]), options: vals.map((v) => ({ value: optValue(v), label: labelOf(v), codePart: codeOf(v) })) } : null
    const fields = [
      mk('model', 'Модификация', mods, (v) => v),
      { id: 'ex', label: 'Взрывозащита', default: 'none', options: uniq((v) => v.ex).map((e) => EXOPT[e]) },
      mk('nsh', 'НСХ / тип термопары', uniq((v) => v.nsh), (v) => v),
      mk('range', 'Диапазон рабочих температур, °C', uniq((v) => v.range), (v) => v.replace(/^от\s*/, '').replace(/\s*до\s*/, '…'), (v) => v),
      mk('length', 'Длина монтажной части L, мм', uniq((v) => v.L), (v) => v),
      mk('diameter', 'Диаметр d, мм', uniq((v) => v.d), (v) => v),
      mk('material', 'Материал оболочки / арматуры', uniq((v) => v.mat), (v) => v),
      mk('signal', 'Выходной сигнал', uniq((v) => v.sig), (v) => v.replace(/\s+/g, '')),
      { id: 'verif', label: 'Поверка', default: 'yes', options: [{ value: 'yes', label: 'С первичной поверкой', codePart: 'П' }, { value: 'no', label: 'Без поверки', codePart: '' }] },
    ].filter((x): x is ConfigFile['fields'][number] => !!x && x.options.length > 0)
    if (!fields.find((f) => f.id === 'ex' && f.options.length > 1)) fields.splice(fields.findIndex((f) => f.id === 'ex'), 1)

    const rules: ConfigFile['rules'] = []
    for (const [m, v] of perModel) {
      const rule = (field: string, all: string[], allowed: string[], what: string) => {
        const blocked = all.filter((x) => !allowed.includes(x)).map(optValue)
        if (allowed.length && blocked.length) rules.push({ when: { field: 'model', in: [optValue(m)] }, disable: { field, values: blocked }, reason: `Для модификации ${m} ${what} ограничены описанием на странице` })
      }
      rule('nsh', uniq((x) => x.nsh), v.nsh, 'НСХ'); rule('range', uniq((x) => x.range), v.range, 'диапазоны'); rule('length', uniq((x) => x.L), v.L, 'длины')
      rule('diameter', uniq((x) => x.d), v.d, 'диаметры'); rule('material', uniq((x) => x.mat), v.mat, 'материалы'); rule('signal', uniq((x) => x.sig), v.sig, 'сигналы')
      const ex = fields.find((f) => f.id === 'ex'); if (ex) { const blocked = ex.options.filter((o) => !v.ex.includes(o.value)).map((o) => o.value); if (blocked.length) rules.push({ when: { field: 'model', in: [optValue(m)] }, disable: { field: 'ex', values: blocked }, reason: `Для модификации ${m} такое исполнение не указано в источнике` }) }
    }
    const ids = fields.map((f) => f.id)
    const parts = ids.filter((i) => i !== 'model').map((i) => `{${i}}`)
    const config: ConfigFile = { fields, rules, basePrice: 0, codeTemplate: ['{model}', ...parts].join('-') }
    // исходные модификации: модель × исполнение
    const sourceMods = mods.flatMap((m) => perModel.get(m)!.ex.map((ex) => ({ model: optValue(m), ...(fields.some((f) => f.id === 'ex') ? { ex } : {}) })))
    return { id: meta.id, name: meta.name, category: 'datchiki-temperatury', pages: list, config, sourceMods, anomalies, free }
  })
}

// ---------- прочие категории: небольшие семейства по словарю ----------
type Rule = { id: string; name: string; test: RegExp; category?: string }
const SMALL: Rule[] = [
  { id: 'bk', name: 'Клапанные блоки БК', test: /^Модификация БК/ },
  { id: 'otvody-os', name: 'Отводы-охладители ОС', test: /^Отвод-охладитель/ },
  { id: 'pi', name: 'Преобразователи измерительные ПИ', test: /^ПИ / },
  { id: 'vme', name: 'Преобразователи измерительные VME', test: /^VME/ },
  { id: 'gilzy', name: 'Гильзы защитные ГЗ', test: /^Гильза защитная/ },
  { id: 'kabelnye-vvody', name: 'Кабельные вводы', test: /^Кабельные вводы/ },
  { id: 'keramicheskie-chehly', name: 'Керамические чехлы', test: /^Керамические чехлы/ },
  { id: 'chuvstvitelnye-elementy', name: 'Чувствительные элементы', test: /^Элемент чувствительный/ },
]

export function buildSmall(pages: Page[]): BuiltFamily[] {
  const rest = pages.filter((p) => p.category !== 'datchiki-temperatury')
  const used = new Set<string>()
  const out: BuiltFamily[] = []
  const make = (id: string, name: string, list: Page[]): BuiltFamily => {
    const anomalies: string[] = []; const free: string[] = []
    const category = list[0].category
    const mods = list.flatMap((p) => modelsOf(p.name).map((m) => ({ m, p })))
    let config: ConfigFile | null = null
    let sourceMods: SourceMod[] = []
    if (mods.length > 1) {
      const label = (m: string) => clean(m.replace(/^Модификация\s+/, '').replace(/^Отвод-охладитель\s+/, '').replace(/^Гильза защитная\s+/, '').replace(/^Элемент чувствительный\s+/, ''))
      const fields: ConfigFile['fields'] = []
      const os = id === 'otvody-os' ? mods.map((x) => /ОС (\d+)\/(\d+)/.exec(x.m)) : []
      if (os.length && os.every(Boolean)) {
        const d = [...new Set(os.map((m) => m![1]))]; const l = [...new Set(os.map((m) => m![2]))].sort((a, b) => Number(a) - Number(b))
        fields.push({ id: 'd', label: 'Условный диаметр, мм', default: d[0], options: d.map((v) => ({ value: v, label: v, codePart: v })) })
        fields.push({ id: 'l', label: 'Длина, мм', default: l[0], options: l.map((v) => ({ value: v, label: v, codePart: v })) })
        const rules = d.map((dv) => ({ when: { field: 'd', in: [dv] }, disable: { field: 'l', values: l.filter((lv) => !os.some((m) => m![1] === dv && m![2] === lv)) }, reason: `Для диаметра ${dv} такая длина не указана в каталоге` })).filter((r) => r.disable.values.length)
        config = { fields, rules, basePrice: 0, codeTemplate: 'ОС-{d}/{l}' }
        sourceMods = os.map((m) => ({ d: m![1], l: m![2] }))
      } else {
        fields.push({ id: 'model', label: 'Модификация', default: optValue(label(mods[0].m)), options: mods.map((x) => ({ value: optValue(label(x.m)), label: label(x.m), codePart: label(x.m) })) })
        const ex = [...new Set(mods.flatMap((x) => KIND_EX(x.p.name, x.p.text)))]
        const exHas = mods.some((x) => /Ex[id]/.test(exFix(x.p.name)))
        if (exHas && ex.length > 1) fields.push({ id: 'ex', label: 'Взрывозащита', default: 'none', options: ex.map((e) => EXOPT[e]) })
        config = { fields, rules: [], basePrice: 0, codeTemplate: fields.map((f) => `{${f.id}}`).join('-') }
        sourceMods = mods.map((x) => ({ model: optValue(label(x.m)) }))
        if (exHas && ex.length > 1) free.push('сочетания «модификация × взрывозащита» не ограничены: в источнике не сказано, какие модификации выпускаются во всех исполнениях')
      }
    }
    return { id, name, category, pages: list, config, sourceMods, anomalies, free }
  }
  for (const r of SMALL) { const list = rest.filter((p) => r.test.test(p.name)); list.forEach((p) => used.add(p.slug)); if (list.length) out.push(make(r.id, r.name, list)) }
  for (const p of rest) if (!used.has(p.slug)) out.push(make(`item-${p.slug}`.slice(0, 60), p.name, [p]))
  return out
}
