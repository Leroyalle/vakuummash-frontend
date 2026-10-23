import { z } from 'zod'
import type { ConfigSchema } from '@/configurator/types'
import categoriesJson from './categories.json'
import { COMPANY_OVERRIDE } from './company'
import documentsJson from './documents.json'
import pagesJson from './pages.json'
import familiesJson from './families.json'
import familyContentJson from './family-content.json'
import projectsJson from './projects.json'
import reviewsJson from './reviews.json'
import {
  CategoryNode, Contacts, MigratedDocument, MigratedPage, MigratedProject, MigratedReview,
} from './schema'
import { ConfigFileSchema, FamilyContentSchema, FamilySchema } from './structure-schema'
import type { Category, Product } from './types'

// Данные валидируются при загрузке: если миграция выдала неверную форму, приложение упадёт сразу и понятно.
const nodes = z.array(CategoryNode).parse(categoriesJson)
export const contacts = Contacts.parse(COMPANY_OVERRIDE.contacts)
export const documents = z.array(MigratedDocument).parse(documentsJson)
export const projects = z.array(MigratedProject).parse(projectsJson)
export const reviews = z.array(MigratedReview).parse(reviewsJson)
// Текст «О нас» заменён на данные с vmelectro.ru, блок «Награды, сертификаты» сохранён из миграции.
export const pages = z.array(MigratedPage).parse(pagesJson).map((p) => {
  if (p.slug !== 'about' || p.group !== 'page') return p
  const certs = p.html.indexOf('<h2>НАГРАДЫ')
  return { ...p, html: COMPANY_OVERRIDE.aboutHtml + (certs >= 0 ? p.html.slice(certs) : '') }
})
const families = z.array(FamilySchema).parse(familiesJson)
const familyContent = z.record(z.string(), FamilyContentSchema).parse(familyContentJson)
const configs = Object.fromEntries(
  Object.entries(import.meta.glob('./configs/*.json', { eager: true, import: 'default' })).map(([path, json]) => [path.replace(/^.*\/|\.json$/g, ''), ConfigFileSchema.parse(json)]),
)

export const pageBySlug = (slug: string) => pages.find((p) => p.slug === slug && p.group === 'page')
export const pagesOf = (group: MigratedPage['group']) => pages.filter((p) => p.group === group)

// ---------- каталог ----------
const ROOT_ORDER = [
  'datchiki-davleniya', 'datchiki-temperatury', 'preobrazovateli-izmeritelnye', 'klapannye-bloki', 'otvody-ohladiteli',
  'uzly-i-detali-dlya-remonta-i-montazha', 'nagrevateli-dlya-plavki-alyuminiya', 'poverka-sredstv-izmerenij', 'uslugi-po-glubokomu-sverleniyu',
]
const ICONS: Record<string, Category['icon']> = {
  'datchiki-davleniya': 'gauge', 'datchiki-temperatury': 'thermo', 'klapannye-bloki': 'valve', 'uzly-i-detali-dlya-remonta-i-montazha': 'valve', 'otvody-ohladiteli': 'valve',
}
const productNodes = nodes.filter((n) => n.kind === 'product')

const shortLabel = (s: string) => s.replace(/\s*\(.*$/, '')

/** Бейджи карточки: число модификаций, взрывозащита, цифровые интерфейсы. */
function badgesOf(keyParams: Record<string, string[]>, models: number): string[] {
  const out: string[] = []
  if (models > 1) out.push(`${models} модификаций`)
  const ex = keyParams['Взрывозащита']
  if (ex && ex.length > 1) out.push('Ex')
  const sig = (keyParams['Выходной сигнал'] ?? []).map(shortLabel)
  for (const s of sig) if (/HART|RS/.test(s)) out.push(s.replace(/^.*\+\s*/, ''))
  return [...new Set(out)].slice(0, 4)
}

export const products: Product[] = families.map((f) => {
  const config = configs[f.id]
  const models = config?.fields.find((x) => x.id === 'model')?.options.length ?? 0
  return {
    id: f.id, category: f.category, sub: null, name: f.name, short: familyContent[f.id].summary, images: f.images,
    attributes: Object.entries(f.keyParams).filter(([, v]) => v.length).map(([name, values]) => ({ name, values })),
    badges: badgesOf(f.keyParams, models), content: familyContent[f.id], legacyText: f.legacyText, documents: [], price: null,
    schema: config as ConfigSchema | undefined,
  }
})

export const categories: Category[] = ROOT_ORDER.flatMap((slug) => {
  const root = productNodes.find((n) => n.slug === slug)
  const list = products.filter((p) => p.category === slug)
  if (!root || !list.length) return []
  const subs = new Map<string, { id: string; name: string; count: number }>()
  for (const p of list) if (p.sub) subs.set(p.sub.id, { ...p.sub, count: (subs.get(p.sub.id)?.count ?? 0) + 1 })
  return [{ id: slug, name: root.name, count: list.length, icon: ICONS[slug] ?? 'plug', subcategories: [...subs.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru')) }]
})

/** Отрасли — из рубрик отзывов старого сайта */
export const industries = [...reviews.reduce((m, r) => (r.industry ? m.set(r.industry, (m.get(r.industry) ?? 0) + 1) : m), new Map<string, number>())]
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)

export const docKindLabels: Record<string, string> = {
  certificate: 'Сертификат', declaration: 'Декларация', attestation: 'Свидетельство', policy: 'Политика', diploma: 'Диплом',
  patent: 'Патент', manual: 'Руководство', method: 'Методика', form: 'Опросный лист', catalog: 'Каталог', other: 'Прочее',
}
export const docScopeLabels: Record<string, string> = { pressure: 'Датчики давления', temperature: 'Датчики температуры', general: 'Общие' }

/** Блок «Популярное»: по два первых товара основных рубрик */
export const featuredProducts: Product[] = [
  ...products.filter((p) => p.category === 'datchiki-davleniya').slice(0, 2),
  ...products.filter((p) => p.category === 'datchiki-temperatury').slice(0, 2),
]
