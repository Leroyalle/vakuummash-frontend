import { categories, documents, featuredProducts, industries, pages, products, projects, reviews } from '@/data'
import { faq, staff } from '@/data/mocks'
import type { Product } from '@/data/types'

const delay = () => new Promise((r) => setTimeout(r, 300 + Math.random() * 200))

/** `?mock=error` или `?mock=empty` в адресе имитируют сбой и пустую выдачу. */
const mockFlag = () => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('mock'))

async function respond<T>(data: T, empty?: T): Promise<T> {
  await delay()
  const flag = mockFlag()
  if (flag === 'error') throw new Error('Mock API error')
  if (flag === 'empty' && empty !== undefined) return empty
  return data
}

export type CatalogQuery = {
  category?: string
  q?: string
  sub?: string[]
  f?: Record<string, string[]>
  sort?: 'default' | 'name'
  page?: number
  perPage?: number
}

export type Facets = {
  subs: { id: string; name: string; count: number }[]
  attrs: { name: string; values: { value: string; count: number }[] }[]
}

const MAX_FACET_VALUES = 14

function facetsOf(list: Product[]): Facets {
  const subs = new Map<string, { id: string; name: string; count: number }>()
  const attrs = new Map<string, Map<string, number>>()
  for (const p of list) {
    if (p.sub) subs.set(p.sub.id, { ...p.sub, count: (subs.get(p.sub.id)?.count ?? 0) + 1 })
    for (const a of p.attributes) {
      const m = attrs.get(a.name) ?? attrs.set(a.name, new Map()).get(a.name)!
      for (const v of a.values) m.set(v, (m.get(v) ?? 0) + 1)
    }
  }
  return {
    subs: [...subs.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    attrs: [...attrs]
      .filter(([, m]) => m.size > 1 && m.size <= MAX_FACET_VALUES)
      .map(([name, m]) => ({ name, values: [...m].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value, 'ru', { numeric: true })) })),
  }
}

const emptyFacets: Facets = { subs: [], attrs: [] }

function queryProducts(q: CatalogQuery) {
  const base = products.filter((p) => !q.category || p.category === q.category)
  const needle = q.q?.trim().toLowerCase()
  const filtered = base.filter(
    (p) =>
      (!needle || `${p.name} ${p.short}`.toLowerCase().includes(needle)) &&
      (!q.sub?.length || (p.sub && q.sub.includes(p.sub.id))) &&
      Object.entries(q.f ?? {}).every(([name, vals]) => !vals.length || p.attributes.some((a) => a.name === name && a.values.some((v: string) => vals.includes(v)))),
  )
  const list = q.sort === 'name' ? [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true })) : filtered
  const perPage = q.perPage ?? 12
  const page = Math.max(1, q.page ?? 1)
  return { items: list.slice((page - 1) * perPage, page * perPage), total: list.length, facets: facetsOf(base) }
}

export const api = {
  categories: () => respond(categories),
  industries: () => respond(industries),
  projects: () => respond(projects, []),
  project: (slug: string) => respond(projects.find((x) => x.slug === slug) ?? null),
  reviews: () => respond(reviews, []),
  documents: () => respond(documents, []),
  faq: () => respond(faq, []),
  staff: () => respond(staff),
  popular: () => respond(featuredProducts),
  product: (id: string) => respond(products.find((p) => p.id === id) ?? null),
  similar: (p: Product) => respond(products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 3)),
  products: (q: CatalogQuery) => respond(queryProducts(q), { items: [], total: 0, facets: emptyFacets }),
  pages: (group: 'support' | 'vacancy' | 'press') => respond(pages.filter((p) => p.group === group), []),
  page: (slug: string) => respond(pages.find((p) => p.slug === slug) ?? null),
}
