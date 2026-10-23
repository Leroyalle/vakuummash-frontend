import { mkdirSync, writeFileSync } from 'node:fs'
import { z } from 'zod'
import { defaultState, resolve } from '../../src/configurator/engine'
import { ConfigFileSchema, FamilySchema, type ConfigFile, type Family } from '../../src/data/structure-schema'
import { clean, latin, log } from './common'
import { describeFamily, describePage } from './describe'
import { FamilyContentSchema, type FamilyContent } from '../../src/data/structure-schema'
import { buildSmall, buildTemperature, loadPages, type BuiltFamily } from './others'
import { buildPressure, type ParsedPage } from './pressure'

type Built = { id: string; name: string; category: string; pages: ParsedPage[]; config: ConfigFile; anomalies: string[]; free: string[]; kind: string }
type Check = { family: string; total: number; ok: number; failed: string[] }

const norm = (s: string) => latin(s).replace(/[–—-]/g, '-').replace(/\s+/g, '').replace(/,/g, '.')

/** Воспроизводится ли каждая исходная модификация (строка таблицы моделей × ВПИ и пример заказа) конфигуратором. */
function verify(f: Built): Check {
  const res: Check = { family: f.id, total: 0, ok: 0, failed: [] }
  const schema = f.config
  const field = (id: string) => schema.fields.find((x) => x.id === id)
  const select = (id: string, test: (o: ConfigFile['fields'][number]['options'][number]) => boolean) => field(id)?.options.find(test)?.value

  for (const pg of f.pages) {
    // (а) модель × исполнение × ВПИ из таблицы
    for (const m of pg.models) for (const ex of m.ex) for (const r of m.ranges) {
      res.total++
      const want = { model: m.model, ex, range: schema.fields[2].options.find((o) => o.label === r)?.value ?? '' }
      const out = resolve(schema, { ...defaultState(schema), ...want })
      if (out.state.model === want.model && out.state.ex === want.ex && out.state.range === want.range) res.ok++
      else res.failed.push(`${pg.slug.slice(0, 30)}: ${m.model} ${ex} ${r}`)
    }
    // (б) пример заказа целиком
    if (pg.example.length >= 10) {
      res.total++
      const t = pg.example
      const exTok = /Exi/.test(t[3]) ? 'Exi' : /Exd/.test(t[3]) ? 'Exd' : 'none'
      const state: Record<string, string | undefined> = {
        model: select('model', (o) => o.codePart === t[2]), ex: exTok,
        range: select('range', (o) => norm(o.codePart) === norm(t[4])), accuracy: select('accuracy', (o) => o.codePart === t[5]),
        elec: select('elec', (o) => norm(o.codePart) === norm(t[6])), signal: select('signal', (o) => o.codePart === t[7]),
        ip: select('ip', (o) => o.codePart === t[8]), conn: select('conn', (o) => norm(o.codePart) === norm(t[9])),
        climate: select('climate', (o) => o.codePart === t[10].replace(/\(.*$/, '')), material: select('material', (o) => o.codePart === (t[12] ?? t[11])),
        verif: t.includes('П') ? 'yes' : 'no', special: t.includes('Q') ? 'q' : 'no',
      }
      const missing = Object.entries(state).filter(([k, v]) => v === undefined && field(k)).map(([k]) => k)
      if (missing.length) res.failed.push(`пример ${pg.slug.slice(0, 30)}: нет значений для ${missing.join(', ')}`)
      else {
        const out = resolve(schema, state as Record<string, string>)
        const kept = Object.entries(state).every(([k, v]) => !field(k) || out.state[k] === v)
        if (kept) res.ok++
        else res.failed.push(`пример ${pg.slug.slice(0, 30)}: сочетание запрещено правилами`)
      }
    }
  }
  return res
}

function verifyGeneric(f: BuiltFamily): Check {
  const res: Check = { family: f.id, total: 0, ok: 0, failed: [] }
  if (!f.config) return res
  for (const mod of f.sourceMods) {
    res.total++
    const out = resolve(f.config, { ...defaultState(f.config), ...mod })
    if (Object.entries(mod).every(([k, v]) => out.state[k] === v)) res.ok++
    else res.failed.push(`${f.pages[0].name.slice(0, 30)}: ${Object.values(mod).join(' ')}`)
  }
  return res
}

function main() {
  const built: Built[] = buildPressure().families.map((f) => ({ ...f, category: 'datchiki-davleniya' }))
  mkdirSync('src/data/configs', { recursive: true })
  const families: Family[] = []
  const checks: Check[] = []
  for (const f of built) {
    const config = ConfigFileSchema.parse(f.config)
    writeFileSync(`src/data/configs/${f.id}.json`, JSON.stringify(config, null, 2) + '\n')
    const label = (id: string) => config.fields.find((x) => x.id === id)?.options.map((o) => o.label) ?? []
    families.push(FamilySchema.parse({
      id: f.id, name: f.name, category: f.category, sourceSlugs: f.pages.map((p) => p.slug),
      images: [...new Set(f.pages.flatMap((p) => p.images))].slice(0, 6),
      legacyText: f.pages.map((p) => `${p.name}\n${clean(p.text)}`).join('\n\n'),
      keyParams: { Модель: label('model'), Взрывозащита: label('ex'), 'Выходной сигнал': label('signal'), 'Присоединение к процессу': label('conn') },
    }))
    checks.push(verify(f))
  }

  const pages = loadPages()
  const content: Record<string, FamilyContent> = {}
  const pageHtml = new Map<string, string>([...pages.map((p) => [p.slug, p.html] as [string, string]), ...built.flatMap((f) => f.pages.map((p) => [p.slug, p.html] as [string, string]))])
  const describeBuilt = (id: string, ps: { slug: string; name: string }[], fallback: string) => {
    const parts = ps.map((p) => describePage(pageHtml.get(p.slug) ?? '', p.name, p.slug))
    content[id] = FamilyContentSchema.parse(describeFamily(fallback, parts))
    return parts
  }
  for (const f of built) describeBuilt(f.id, f.pages, `${f.name}: моделей — ${f.config.fields[0].options.length}`)
  const others = [...buildTemperature(pages), ...buildSmall(pages)]
  for (const f of others) {
    describeBuilt(f.id, f.pages, f.name)
    if (f.config) { const config = ConfigFileSchema.parse(f.config); writeFileSync(`src/data/configs/${f.id}.json`, JSON.stringify(config, null, 2) + '\n') }
    families.push(FamilySchema.parse({
      id: f.id, name: f.name, category: f.category, sourceSlugs: f.pages.map((p) => p.slug), images: [...new Set(f.pages.flatMap((p) => p.images))].slice(0, 6),
      legacyText: f.pages.map((p) => `${p.name}\n${clean(p.text)}`).join('\n\n'),
      keyParams: Object.fromEntries((f.config?.fields ?? []).filter((x) => x.id !== 'verif').map((x) => [x.label, x.options.map((o) => o.label)])),
    }))
    checks.push(verifyGeneric(f))
  }
  writeFileSync('src/data/families.json', JSON.stringify(z.array(FamilySchema).parse(families), null, 2) + '\n')
  type Row = { id: string; pages: number; config: ConfigFile | null; combos: number; free: string[]; anomalies: string[] }
  const rows: Row[] = [
    ...built.map((f): Row => ({ id: f.id, pages: f.pages.length, config: f.config, combos: f.pages.flatMap((p) => p.models.map((m) => m.ex.length * m.ranges.length)).reduce((a, b) => a + b, 0), free: f.free, anomalies: f.anomalies })),
    ...others.map((f): Row => ({ id: f.id, pages: f.pages.length, config: f.config, combos: f.sourceMods.length, free: f.free, anomalies: f.anomalies })),
  ]
  writeFileSync('src/data/family-content.json', JSON.stringify(content, null, 2) + '\n')
  const cs = Object.values(content)
  const stat = (n: string, k: number) => `${n}: ${k}`
  console.log([stat('семейств с областью применения', cs.filter((c) => c.applications.length).length), stat('с особенностями', cs.filter((c) => c.advantages.length).length), stat('с таблицей характеристик', cs.filter((c) => c.pages.some((p) => p.specGroups.length)).length), stat('со схемой заказа', cs.filter((c) => c.pages.some((p) => p.orderHtml)).length), stat('из', cs.length)].join('; '))
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
  const lines = [
    '# Отчёт о структурировании данных', '', `Скрипт: \`npm run structure\` (${new Date().toISOString().slice(0, 10)}).`, '',
    '## Сводка', '',
    `- Исходных страниц: ${sum(rows.map((f) => f.pages))} → семейств: **${rows.length}** (с конфигуратором: ${rows.filter((f) => f.config).length})`,
    `- Полей/опций: ${sum(rows.map((f) => f.config?.fields.length ?? 0))} / ${sum(rows.map((f) => sum((f.config?.fields ?? []).map((x) => x.options.length))))}; правил: ${sum(rows.map((f) => f.config?.rules.length ?? 0))}`,
    `- Комбинаций «модель × исполнение × ВПИ» по таблицам: ${sum(rows.map((r) => r.combos))}`,
    `- **Воспроизведено ${sum(checks.map((c) => c.ok))} из ${sum(checks.map((c) => c.total))}** исходных модификаций`, '',
    '| Семейство | Страниц | Моделей | Опций | Воспроизведено |', '|---|---|---|---|---|',
    ...rows.map((f, i) => `| ${f.id} | ${f.pages} | ${f.config?.fields[0].options.length ?? '—'} | ${sum((f.config?.fields ?? []).map((x) => x.options.length))} | ${f.config ? `${checks[i].ok} из ${checks[i].total}` : 'без конфигуратора'} |`), '',
    '## Решения, нужные от вас', '',
    '1. **Коды выходного сигнала.** Источник даёт один код на страницу (42N / 42 / Н / 42NC / 05N). Для вариантов HART и RS-485 код не указан, в артикуле подставлены «HART» / «RS485» (помечены как неподтверждённые). Нужна таблица кодов.',
    '2. **Взрывозащита × сигнал / ввод.** Страницы не говорят, какие сочетания (например, Ex ia с RS-485, Ex d с разъёмом DIN) недопустимы, поэтому правил нет — эти опции свободные.',
    '3. **Датчики ДИВ.** В таблицах ВПИ записан как «±0,05 МПа», в примерах заказа как «-0,05/1,5 МПа». Нужна единая запись.',
    '4. **Температура.** Схема заказа у каждой модификации своя (разный набор и порядок позиций), поэтому артикул собирается единым шаблоном из выбранных опций, а не по схеме каждой страницы. Нужны правила сборки артикула по сериям, если важно совпадение с каталогом.',
    '5. **Малые категории** (клапанные блоки, гильзы, чехлы, вводы): в источнике только перечень модификаций, поэтому конфигуратор — выбор модификации и (где есть) исполнения. Цен нет нигде.', '',
    '## Не воспроизведено', '', ...(checks.flatMap((c) => c.failed.map((x) => `- ${c.family}: ${x}`)).slice(0, 80) || ['- нет']), '',
    '## Свободные опции и неподтверждённые коды', '', ...rows.flatMap((f) => f.free.slice(0, 12).map((x) => `- ${f.id}: ${x}`)), '',
    '## Расхождения в источнике', '', ...rows.flatMap((f) => f.anomalies.map((x) => `- ${f.id}: ${x}`)), '',
  ]
  writeFileSync('src/data/_structure-report.md', lines.join('\n'))
  log(lines.slice(4, 12).join('\n'))
  console.log(`семейств ${rows.length}; опций ${sum(rows.map((f) => sum((f.config?.fields ?? []).map((x) => x.options.length))))}; комбинаций ${sum(rows.map((r) => r.combos))}; воспроизведено ${sum(checks.map((c) => c.ok))} из ${sum(checks.map((c) => c.total))}`)
  for (const c of checks) if (c.total) console.log(`  ${c.family.padEnd(36)} ${c.ok}/${c.total}`)
}
main()
