import { queryOptions } from '@tanstack/react-query'
import { api, type CatalogQuery } from '.'

export const q = {
  categories: () => queryOptions({ queryKey: ['categories'], queryFn: api.categories, staleTime: 5 * 60_000 }),
  industries: () => queryOptions({ queryKey: ['industries'], queryFn: api.industries, staleTime: 5 * 60_000 }),
  stats: () => queryOptions({ queryKey: ['stats'], queryFn: api.stats }),
  projects: () => queryOptions({ queryKey: ['projects'], queryFn: api.projects }),
  project: (slug: string) => queryOptions({ queryKey: ['project', slug], queryFn: () => api.project(slug) }),
  reviews: () => queryOptions({ queryKey: ['reviews'], queryFn: api.reviews }),
  documents: () => queryOptions({ queryKey: ['documents'], queryFn: api.documents }),
  faq: () => queryOptions({ queryKey: ['faq'], queryFn: api.faq }),
  staff: () => queryOptions({ queryKey: ['staff'], queryFn: api.staff }),
  popular: () => queryOptions({ queryKey: ['popular'], queryFn: api.popular }),
  product: (id: string) => queryOptions({ queryKey: ['product', id], queryFn: () => api.product(id) }),
  similar: (id: string) => queryOptions({ queryKey: ['similar', id], queryFn: () => api.similar({ id }) }),
  products: (query: CatalogQuery) => queryOptions({ queryKey: ['products', query], queryFn: () => api.products(query), placeholderData: (prev) => prev }),
  pages: (group: 'support' | 'vacancy' | 'press') => queryOptions({ queryKey: ['pages', group], queryFn: () => api.pages(group) }),
  page: (slug: string) => queryOptions({ queryKey: ['page', slug], queryFn: () => api.page(slug) }),
}
