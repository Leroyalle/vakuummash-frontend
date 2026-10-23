import { readFileSync } from 'node:fs'
import { MigratedProduct } from '../../src/data/schema'
import type { ConfigFile } from '../../src/data/structure-schema'
import { z } from 'zod'
import { clean, expandCodes, latin, log, normSignal, optValue, parseRanges, tableRows, toText } from './common'

export type ParsedPage = {
  slug: string; name: string; text: string; rows: Record<string, string>
  kind: string; models: { model: string; ex: ('none' | 'Exi' | 'Exd')[]; ranges: string[] }[]
  example: string[]; images: string[]; html: string
}
export type PressureResult = { families: { id: string; name: string; kind: string; pages: ParsedPage[]; config: ConfigFile; anomalies: string[]; free: string[] }[] }

const KIND_NAME: Record<string, string> = { ДИ: 'избыточного давления', ДА: 'абсолютного давления', ДВ: 'вакуумметрического давления', ДИВ: 'избыточно-вакуумметрического давления', ДГ: 'гидростатического давления (уровня)', ДД: 'дифференциального давления' }
const APP = /для (гидравлич|гидроключ|компрессорн)/i

export function loadPressure() {
  return z.array(MigratedProduct).parse(JSON.parse(readFileSync('src/data/products.json', 'utf8'))).filter((p) => p.rootCategory === 'datchiki-davleniya')
}

export function parsePage(p: ReturnType<typeof loadPressure>[number]): ParsedPage {
  const text = toText(p.html)
  const rows = tableRows(text)
  const example = (/Пример обозначения[^\n]*\n([^\n]+)/.exec(text)?.[1] ?? '').split('|').map(clean).filter(Boolean)
  const models: ParsedPage['models'] = []
  for (const m of text.matchAll(/^\s*(VMP-[^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|/gm)) {
    const found = [...m[1].matchAll(/VMP-[А-ЯA-Z]+-(\d{4})(?:-?(Exi|Exd))?/g)]
    const ranges = parseRanges(m[2])
    if (!found.length || !ranges.length) continue
    const model = found[0][1]
    models.push({ model, ex: [...new Set(found.map((f) => (f[2] ?? 'none') as 'none' | 'Exi' | 'Exd'))], ranges })
  }
  return { slug: p.slug, name: p.name, text, rows, kind: example[1] ?? '', models, example, images: p.images, html: p.html }
}

function familyKey(pg: ParsedPage) {
  if (APP.test(pg.name)) return `app-${pg.slug.replace(/^datchiki-davleniya-dlya-/, '').split('-').slice(0, 2).join('-')}`
  if (/^vmp-di-1160/.test(pg.slug)) return 'ДИ'
  return pg.kind
}

type Opt = { value: string; label: string; codePart: string; spec?: Record<string, string>; unverified?: boolean }
const addOpt = (list: Opt[], o: Opt, anomalies: string[], what: string) => {
  const ex = list.find((x) => x.value === o.value)
  if (!ex) list.push(o)
  else if (ex.label !== o.label) anomalies.push(`${what}: код ${o.codePart} описан по-разному («${ex.label.slice(0, 40)}» / «${o.label.slice(0, 40)}»), взято первое`)
}

export function buildFamily(key: string, pages: ParsedPage[]) {
  const anomalies: string[] = []
  const free: string[] = []
  const isApp = key.startsWith('app-')
  const id = isApp ? `vmp-${key}` : `vmp-${{ ДИ: 'di', ДА: 'da', ДВ: 'dv', ДИВ: 'div', ДГ: 'dg', ДД: 'dd' }[key] ?? key}`
  const name = isApp ? pages[0].name.replace(/\.$/, '') : `Датчики ${KIND_NAME[key] ?? key} VMP-${key}`

  // --- модели, взрывозащита, диапазоны ---
  const modelRanges = new Map<string, Set<string>>()
  const modelEx = new Map<string, Set<string>>()
  for (const pg of pages) for (const m of pg.models) {
    const r = modelRanges.get(m.model) ?? new Set<string>()
    const prev = [...r]
    m.ranges.forEach((x) => r.add(x))
    if (prev.length && prev.join() !== [...r].join() && m.ranges.join() !== prev.join()) anomalies.push(`модель ${m.model}: списки ВПИ на страницах различаются, взято объединение`)
    modelRanges.set(m.model, r)
    const e = modelEx.get(m.model) ?? new Set<string>()
    m.ex.forEach((x) => e.add(x))
    modelEx.set(m.model, e)
  }
  const models = [...modelRanges.keys()].sort()
  const rangeSet = [...new Set([...modelRanges.values()].flatMap((s) => [...s]))]
  const exList: Opt[] = [{ value: 'none', label: 'Без взрывозащиты', codePart: '–' }]
  if (pages.some((pg) => /Exi|Ex ia/.test(pg.text))) exList.push({ value: 'Exi', label: 'Ex ia (искробезопасная цепь)', codePart: 'Exi' })
  if (pages.some((pg) => /Exd|Ex d/.test(pg.text))) exList.push({ value: 'Exd', label: 'Ex d (взрывонепроницаемая оболочка)', codePart: 'Exd' })
  if (isApp && !models.length) free.push('таблица моделей отсутствует — поля «модель/ВПИ» заполнены из примера заказа')

  // --- опции из строк таблиц ---
  const signal: Opt[] = []; const accuracy: Opt[] = []; const elec: Opt[] = []; const conn: Opt[] = []; const climate: Opt[] = []; const material: Opt[] = []; const ip: Opt[] = []
  const exampleTok = (i: number) => pages.map((pg) => pg.example[i]).filter(Boolean).map((t) => (i === 6 || i === 9 ? latin(t) : t))
  const defaultSignalCode = exampleTok(7).find((c) => /^42N?$/.test(c)) ?? exampleTok(7)[0] ?? ''
  for (const pg of pages) {
    const sig = pg.rows['Выходной сигнал']
    if (sig) sig.split(/\s*\/\s*/).filter((s) => /\d\s*…|HART|RS|Modbus|В\b/.test(s)).forEach((s, i) => {
      const label = normSignal(s)
      addOpt(signal, { value: optValue(label), label, codePart: i === 0 ? defaultSignalCode : /HART/.test(label) ? 'HART' : /RS/.test(label) ? 'RS485' : '?', unverified: i > 0 }, anomalies, 'сигнал')
    })
    const acc = pg.rows['Основная погрешность'] ?? pg.rows['Погрешность измерений']
    for (const n of (acc ?? '').match(/\d+(?:,\d+)?/g) ?? []) if (Number(n.replace(',', '.')) <= 2) addOpt(accuracy, { value: optValue(n), label: `±${n} % ВПИ`, codePart: n }, anomalies, 'погрешность')
    const el = pg.rows['Присоединение к эл. цепи'] ?? pg.rows['Электрическое присоединение']
    if (el) for (const seg of el.split(/\s(?=[PРCС]\d{2}[A-ZА-Я]?(?:\s*[;:]\s*\d{2})*\s*[–—:-]\s)/)) {
      const m = /^([PРCС]\d{2}[A-ZА-Я]?(?:\s*[;:]\s*\d{2})*)\s*[–—:-]\s*(.+)$/.exec(seg.trim())
      if (m) for (const c0 of expandCodes(m[1])) { const c = latin(c0); addOpt(elec, { value: optValue(c), label: `${c} — ${clean(m[2]).slice(0, 90)}`, codePart: c }, anomalies, 'эл. ввод') }
    }
    const cn = pg.rows['Присоединение к процессу']
    if (cn) for (const seg of cn.split(/,?\s*(?=\b\d{2}\s*[–—]\s)/)) {
      const m = /^(\d{2})\s*[–—]\s*(.+?)[,\s]*$/.exec(seg.trim())
      if (m) addOpt(conn, { value: m[1], label: `${m[1]} — ${clean(m[2].replace(/,?\s*другое по согласованию.*$/i, ''))}`, codePart: m[1] }, anomalies, 'штуцер')
    }
    for (const key2 of ['По умолчанию', 'Опция (с указанием пределов) требуемого диапазона температур', 'Опция (с указанием пределов требуемого диапазона температур)', 'Опция (с указанием пределов)'])
      for (const m of (pg.rows[key2] ?? '').matchAll(/(t\d)\s*\(([^)]*)\)/g)) addOpt(climate, { value: m[1], label: `${m[1]} (${m[2]})`, codePart: m[1] }, anomalies, 'климат')
    const mat = pg.rows['Материал мембраны/штуцера'] ?? pg.rows['Материал мембраны/корпуса'] ?? pg.rows['Материал мембраны']
    if (mat) for (const m of mat.matchAll(/(?:^|\s)(\d):\s*(.+?)(?=\s\d:\s|\sДругое|$)/g)) addOpt(material, { value: m[1], label: `${m[1]} — ${clean(m[2])}`, codePart: m[1] }, anomalies, 'материал')
    for (const m of pg.text.matchAll(/\bIP\d{2}\b/g)) addOpt(ip, { value: m[0], label: m[0], codePart: m[0] }, anomalies, 'IP')
  }
  // --- пример заказа как источник значений, не описанных таблицами ---
  const fromExample = (list: Opt[], tokens: string[], mk: (t: string) => Opt, what: string) => {
    for (const t of tokens) if (t && !/^[–—-]$/.test(t) && !list.some((o) => o.codePart === t)) { list.push({ ...mk(t), unverified: true }); free.push(`${what}: значение «${t}» есть только в примере заказа`) }
  }
  fromExample(elec, exampleTok(6), (t) => ({ value: optValue(t), label: `${t} — по примеру заказа`, codePart: t }), 'эл. ввод')
  fromExample(conn, exampleTok(9), (t) => ({ value: optValue(t), label: `${t} — по примеру заказа`, codePart: t }), 'штуцер')
  fromExample(climate, exampleTok(10), (t) => ({ value: optValue(t), label: t, codePart: t }), 'климат')
  fromExample(ip, exampleTok(8), (t) => ({ value: t, label: t, codePart: t }), 'IP')
  if (!signal.length) fromExample(signal, exampleTok(7), (t) => ({ value: optValue(t), label: `Код ${t}`, codePart: t }), 'сигнал')
  if (!accuracy.length) fromExample(accuracy, exampleTok(5), (t) => ({ value: optValue(t), label: `±${t} %`, codePart: t }), 'погрешность')
  if (!material.length) fromExample(material, exampleTok(12), (t) => ({ value: t, label: `Код материала ${t}`, codePart: t }), 'материал')
  for (const l of [signal, elec, conn, climate, material, ip, accuracy]) l.forEach((o) => o.unverified && free.push(`«${o.label.slice(0, 40)}» — код не подтверждён источником`))

  // --- ВПИ как поля ---
  const rangeOpts: Opt[] = (rangeSet.length ? rangeSet : exampleTok(4).map((t) => t)).map((r) => ({ value: optValue(r), label: r, codePart: r.replace(/^[^…]*…/, '').replace(/^0…/, '') })).filter((o, i, a) => a.findIndex((x) => x.value === o.value) === i)
  const modelOpts: Opt[] = (models.length ? models : [...new Set(exampleTok(2))]).map((m) => ({ value: m, label: `Модель ${m}${m.startsWith('1') ? ' (малогабаритный)' : m.startsWith('2') ? ' (интеллектуальный)' : ''}`, codePart: m }))
  const hasVerif = pages.some((pg) => pg.example.includes('П'))
  const hasQ = pages.some((pg) => pg.example.includes('Q'))

  const mkField = (idf: string, label: string, options: Opt[], def?: string) => ({ id: idf, label, options, default: def ?? options[0]?.value ?? '' })
  const fields = [
    mkField('model', 'Модель', modelOpts),
    mkField('ex', 'Взрывозащита', exList),
    mkField('range', 'Верхний предел измерения (ВПИ)', rangeOpts),
    mkField('accuracy', 'Основная погрешность', accuracy.length ? accuracy : [{ value: 'std', label: 'По умолчанию', codePart: '' }]),
    mkField('elec', 'Электрическое присоединение', elec.length ? elec : [{ value: 'std', label: 'По умолчанию', codePart: '' }]),
    mkField('signal', 'Выходной сигнал', signal.length ? signal : [{ value: 'std', label: 'По умолчанию', codePart: '' }]),
    mkField('ip', 'Степень защиты', ip.length ? ip : [{ value: 'std', label: 'По умолчанию', codePart: '' }]),
    mkField('conn', 'Присоединение к процессу', conn.length ? conn : [{ value: 'std', label: 'По умолчанию', codePart: '' }]),
    mkField('climate', 'Климатическое исполнение', climate.length ? climate : [{ value: 'std', label: 'По умолчанию', codePart: '' }]),
    mkField('material', 'Материал мембраны и штуцера', material.length ? material : [{ value: 'std', label: 'По умолчанию', codePart: '' }]),
    ...(hasVerif ? [mkField('verif', 'Поверка', [{ value: 'yes', label: 'С первичной поверкой', codePart: 'П' }, { value: 'no', label: 'Без поверки', codePart: '' }])] : []),
    ...(hasQ ? [mkField('special', 'Специальное исполнение', [{ value: 'no', label: 'Стандартное', codePart: '' }, { value: 'q', label: 'Дополнительная тренировка сенсора (Q)', codePart: 'Q' }], 'no')] : []),
  ]
  // умолчания — как в примерах заказа (первое значение, найденное в примерах)
  const pick = (f: (typeof fields)[number], tok: string | undefined) => { const o = f.options.find((x) => x.codePart === tok); if (o) f.default = o.value }
  const ex1 = pages.find((pg) => pg.example.length)?.example ?? []
  const byId = Object.fromEntries(fields.map((f) => [f.id, f]))
  pick(byId.accuracy, ex1[5]); pick(byId.elec, ex1[6]); pick(byId.signal, ex1[7]); pick(byId.ip, ex1[8]); pick(byId.conn, ex1[9]); pick(byId.climate, ex1[10])
  if (byId.material) pick(byId.material, ex1[12] ?? ex1[11])

  // --- правила: только из таблиц моделей ---
  const rules: ConfigFile['rules'] = []
  if (models.length) for (const m of models) {
    const allowed = modelRanges.get(m)!
    const blockedRanges = rangeOpts.filter((r) => !allowed.has(r.label)).map((r) => r.value)
    if (blockedRanges.length) rules.push({ when: { field: 'model', in: [m] }, disable: { field: 'range', values: blockedRanges }, reason: `Для модели ${m} ВПИ ограничены таблицей исполнений` })
    const allowedEx = modelEx.get(m)!
    const blockedEx = exList.filter((e) => !(e.value === 'none' ? allowedEx.has('none') : allowedEx.has(e.value))).map((e) => e.value)
    if (blockedEx.length && blockedEx.length < exList.length) rules.push({ when: { field: 'model', in: [m] }, disable: { field: 'ex', values: blockedEx } , reason: `Для модели ${m} такое исполнение по взрывозащите не указано в источнике` })
  }
  const template = `VMP-${isApp ? '{model}' : key + '-{model}'}-{ex}-{range}-{accuracy}-{elec}-{signal}-{ip}-{conn}-{climate}-{material}${hasVerif ? '-{verif}' : ''}${hasQ ? '-{special}' : ''}`
  const config: ConfigFile = { fields, rules, codeTemplate: template, basePrice: 0 }
  log(`${id}: pages=${pages.length} models=${models.length} ranges=${rangeOpts.length} rules=${rules.length} anomalies=${anomalies.length} free=${free.length}`)
  return { id, name, kind: key, pages, config, anomalies: [...new Set(anomalies)], free: [...new Set(free)] }
}

export function buildPressure(): PressureResult {
  const pages = loadPressure().map(parsePage)
  const groups = new Map<string, ParsedPage[]>()
  for (const pg of pages) { const k = familyKey(pg); groups.set(k, [...(groups.get(k) ?? []), pg]) }
  return { families: [...groups].map(([k, v]) => buildFamily(k, v)) }
}
