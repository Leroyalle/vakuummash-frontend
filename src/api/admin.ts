import type { AuthUser, Role } from '@/auth/types'
import type { ConfigSchema } from '@/configurator/types'
import { request } from './http'

export type Paged<T> = { items: T[]; total: number; page: number; perPage: number }

export type Lead = {
  id: string; kind: string; name: string; company: string | null; phone: string; email: string | null; comment: string | null
  extra: Record<string, string>; status: string; userId: string | null; assigneeId: string | null; assigneeName: string | null; note: string | null; createdAt: string
}
export type AdminCategory = { id: string; name: string; icon: string; position: number; count: number }
export type AdminProductRow = { id: string; category: string; name: string; short: string; images: string[]; price: number | null; featured: boolean; published: boolean; position: number; hasConfig: boolean }
export type AdminProduct = {
  id: string; categoryId: string; name: string; summary: string; images: string[]; attributes: { name: string; values: string[] }[]; badges: string[]
  content: Record<string, unknown>; legacyText: string; price: number | null; featured: boolean; published: boolean; position: number; config: ConfigSchema | null
}
export type Overview = {
  leads: Record<'new' | 'in_progress' | 'done' | 'rejected', number>
  users: number; products: { total: number; published: number }; pages: number; projects: number; reviews: number; documents: number
}

type Row = Record<string, unknown> & { id: string }
const json = (body: unknown) => ({ body })

export const admin = {
  stats: () => request<Overview>('/admin/stats'),

  leads: (q: { status?: string; kind?: string; q?: string; page?: number; assigneeId?: string }) => request<Paged<Lead>>('/admin/leads', { query: { ...q, perPage: 20 } }),
  lead: (id: string) => request<Lead>(`/admin/leads/${id}`),
  updateLead: (id: string, patch: { status?: string; assigneeId?: string | null; note?: string | null }) => request<Lead>(`/admin/leads/${id}`, { method: 'PATCH', ...json(patch) }),

  users: (q: { q?: string; role?: string; page?: number }) => request<Paged<AuthUser>>('/admin/users', { query: { ...q, perPage: 20 } }),
  createUser: (b: { email: string; password: string; name: string; role: Role }) => request<AuthUser>('/admin/users', { method: 'POST', ...json(b) }),
  updateUser: (id: string, patch: Partial<{ role: Role; isActive: boolean; name: string; password: string }>) => request<AuthUser>(`/admin/users/${id}`, { method: 'PATCH', ...json(patch) }),

  categories: () => request<AdminCategory[]>('/admin/categories'),
  createCategory: (b: { id: string; name: string; icon: string; position: number }) => request<AdminCategory>('/admin/categories', { method: 'POST', ...json(b) }),
  updateCategory: (id: string, b: { name: string; icon: string; position: number }) => request<AdminCategory>(`/admin/categories/${id}`, { method: 'PATCH', ...json(b) }),
  deleteCategory: (id: string) => request<void>(`/admin/categories/${id}`, { method: 'DELETE' }),

  products: (q: { q?: string; categoryId?: string; page?: number }) => request<Paged<AdminProductRow>>('/admin/products', { query: { ...q, perPage: 20 } }),
  product: (id: string) => request<AdminProduct>(`/admin/products/${id}`),
  createProduct: (b: Partial<AdminProduct> & { id: string; categoryId: string; name: string }) => request<AdminProduct>('/admin/products', { method: 'POST', ...json(b) }),
  updateProduct: (id: string, b: Partial<Omit<AdminProduct, 'id'>>) => request<AdminProduct>(`/admin/products/${id}`, { method: 'PUT', ...json(b) }),
  deleteProduct: (id: string) => request<void>(`/admin/products/${id}`, { method: 'DELETE' }),

  list: (type: string) => request<Row[]>(`/admin/${type}`),
  create: (type: string, b: Record<string, unknown>) => request<Row>(`/admin/${type}`, { method: 'POST', ...json(b) }),
  update: (type: string, id: string, b: Record<string, unknown>) => request<Row>(`/admin/${type}/${id}`, { method: 'PATCH', ...json(b) }),
  remove: (type: string, id: string) => request<void>(`/admin/${type}/${id}`, { method: 'DELETE' }),

  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ path: string; url: string; contentType: string; size: number }>('/admin/media', { method: 'POST', form })
  },
}
