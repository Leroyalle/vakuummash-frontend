import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { Contacts } from '../../src/data/schema'
import { ROOT, log, saveRegistry, stats, writeJson } from './lib'
import { documents, issues, pages, products, projects, reviews, taxonomy } from './steps'

async function main() {
  const t0 = Date.now()
  console.log('Миграция vakuummash.ru → src/data (кэш: .cache/, лог: .cache/migrate.log)')
  const tax = await taxonomy()
  writeJson('categories.json', tax.all)

  const result = {
    projects: await projects(tax),
    reviews: await reviews(tax),
    documents: await documents(tax),
    products: await products(tax),
    pages: await pages(tax),
  }
  saveRegistry()
  for (const [k, v] of Object.entries(result)) writeJson(`${k}.json`, v)
  writeJson('contacts.json', Contacts.parse({
    phone: '+7 (3412) 918-650', email: 'zakaz@vakuummash.com', postcode: '426006',
    address: 'г. Ижевск, проезд им. Дерябина, зд. 2/52', legalName: 'НПО «Вакууммаш»',
  }))
  saveRegistry()

  const images = new Set<string>()
  result.products.forEach((p) => p.images.forEach((i) => images.add(i)))
  result.projects.forEach((p) => p.images.forEach((i) => images.add(i)))
  result.reviews.forEach((r) => r.image && images.add(r.image))
  result.pages.forEach((p) => p.images.forEach((i) => images.add(i)))
  const counts = {
    projects: result.projects.length, reviews: result.reviews.length, documents: result.documents.length,
    products: result.products.length, pages: result.pages.length, images: images.size, files: stats.files,
  }
  const byRoot = Object.entries(result.products.reduce<Record<string, number>>((m, p) => ((m[p.rootCategory] = (m[p.rootCategory] ?? 0) + 1), m), {}))
  const noAttr = result.products.filter((p) => !p.attributes.length).length
  const report = [
    '# Отчёт о миграции с vakuummash.ru', '',
    `Сформирован скриптом \`npm run migrate\` (${new Date().toISOString().slice(0, 10)}).`, '',
    '## Сводка', '', ...Object.entries(counts).map(([k, v]) => `- ${k}: **${v}**`), '',
    `- HTTP-запросов к старому сайту: ${stats.http} (из кэша: ${stats.cached}); сбоев: ${stats.failed.length}`, '',
    '## Товары по категориям', '', ...byRoot.map(([k, v]) => `- ${k}: ${v}`), '',
    `Без атрибутов: ${noAttr}. Цена опубликована у: ${result.products.filter((p) => p.price !== null).length}.`, '',
    '## Не удалось / требует внимания', '', ...(issues.length ? issues.map((i) => `- ${i}`) : ['- нет']), '',
    ...(stats.failed.length ? ['## Сетевые сбои', '', ...stats.failed.map((u) => `- ${u}`), ''] : []),
  ].join('\n')
  writeFileSync(join(ROOT, 'src/data/_migration-report.md'), report)
  log(JSON.stringify(counts))
  console.log('\nИтого:', JSON.stringify(counts), `за ${Math.round((Date.now() - t0) / 1000)} с`)
  console.log(`Замечаний: ${issues.length}, сетевых сбоев: ${stats.failed.length} → src/data/_migration-report.md`)
}

main().catch((e) => { console.error('\nОШИБКА:', e instanceof z.ZodError ? JSON.stringify(e.issues.slice(0, 5), null, 1) : e); process.exit(1) })
