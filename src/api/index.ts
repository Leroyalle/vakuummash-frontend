import type { Category, Product, ProductSummary } from '@/data/types'
import type { MigratedDocument, MigratedPage, MigratedProject, MigratedReview } from '@/data/schema'
import { ApiError, request } from './http'

/** `?mock=error` или `?mock=empty` в адресе имитируют сбой и пустую выдачу (для проверки состояний интерфейса). */
const mockFlag = () => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('mock'))

async function get<T>(path: string, o: { empty?: T; query?: Record<string, string | number | undefined> } = {}): Promise<T> {
  const flag = mockFlag()
  if (flag === 'error') throw new Error('Mock API error')
  if (flag === 'empty' && o.empty !== undefined) return o.empty
  return request<T>(path, { query: o.query })
}

const orNull = <T>(p: Promise<T>) => p.catch((e: unknown) => { if (e instanceof ApiError && e.status === 404) return null; throw e })

export type Faq = { id: string; q: string; a: string }
export type Staff = { id: string; name: string; role: string; area: string; phone: string; email: string }

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

export type LeadKind = 'callback' | 'price' | 'selection' | 'contact' | 'dealer' | 'support'
export type LeadInput = { kind: LeadKind; name: string; phone: string; company?: string; email?: string; comment?: string; extra?: Record<string, string> }
export type Stats = { products: number; projects: number; reviews: number; documents: number }

const emptyFacets: Facets = { subs: [], attrs: [] }

export const api = {
  categories: () => get<Category[]>('/categories', { empty: [] }),
  industries: () => get<{ name: string; count: number }[]>('/industries', { empty: [] }),
  stats: () => get<Stats>('/stats'),
  projects: () => get<MigratedProject[]>('/projects', { empty: [] }),
  project: (slug: string) => orNull(get<MigratedProject>(`/projects/${slug}`)),
  reviews: () => get<MigratedReview[]>('/reviews', { empty: [] }),
  documents: () => get<MigratedDocument[]>('/documents', { empty: [] }),
  faq: () => get<Faq[]>('/faq', { empty: [] }),
  staff: () => get<Staff[]>('/staff'),
  popular: () => get<ProductSummary[]>('/products/popular'),
  product: (id: string) => orNull(get<Product>(`/products/${encodeURIComponent(id)}`)),
  similar: (p: Pick<Product, 'id'>) => get<ProductSummary[]>(`/products/${encodeURIComponent(p.id)}/similar`),
  products: (q: CatalogQuery) =>
    get<{ items: ProductSummary[]; total: number; matchedBy?: string | null; facets: Facets }>('/products', {
      empty: { items: [], total: 0, facets: emptyFacets },
      query: {
        category: q.category, q: q.q, sort: q.sort, page: q.page, perPage: q.perPage,
        f: q.f && Object.values(q.f).some((v) => v.length) ? JSON.stringify(q.f) : undefined,
      },
    }),
  pages: (group: MigratedPage['group']) => get<MigratedPage[]>('/pages', { empty: [], query: { group } }),
  page: (slug: string) => orNull(get<MigratedPage>(`/pages/${slug}`)),
  submitLead: (input: LeadInput) => request<{ id: string }>('/leads', { method: 'POST', body: input, noRetry: false }),
}
