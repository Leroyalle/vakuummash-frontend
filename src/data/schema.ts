import { z } from 'zod'

/** Строгие схемы данных, получаемых миграцией со старого сайта (scripts/migrate). */
const localPath = z.string().startsWith('/assets/')

export const FileRef = z.object({
  title: z.string(),
  url: localPath,
  format: z.string(),
  sizeKb: z.number().int().nonnegative(),
})

export const CategoryNode = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
  parent: z.number().int().nullable(),
  kind: z.enum(['product', 'post']),
  count: z.number().int().nonnegative(),
})

export const Attribute = z.object({
  name: z.string(),
  /** значения, разделённые на варианты (если у атрибута несколько значений) */
  values: z.array(z.string()).min(1),
})

export const MigratedProduct = z.object({
  wpId: z.number().int(),
  slug: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  /** id категорий WooCommerce, к которым товар относится на старом сайте */
  categoryIds: z.array(z.number().int()),
  /** слаг корневой категории каталога */
  rootCategory: z.string(),
  html: z.string(),
  summary: z.string(),
  images: z.array(localPath),
  attributes: z.array(Attribute),
  documents: z.array(FileRef),
  /** null — цена на старом сайте не опубликована */
  price: z.number().nullable(),
  sourceUrl: z.string().url(),
})

export const MigratedProject = z.object({
  slug: z.string(),
  title: z.string(),
  region: z.string().nullable(),
  importSubstitution: z.boolean(),
  date: z.string(),
  html: z.string(),
  images: z.array(localPath),
  sourceUrls: z.array(z.string().url()).min(1),
  mergedFrom: z.array(z.number().int()),
})

export const MigratedReview = z.object({
  id: z.number().int(),
  slug: z.string(),
  company: z.string(),
  industry: z.string().nullable(),
  date: z.string(),
  html: z.string(),
  image: localPath.nullable(),
  sourceUrl: z.string().url(),
})

export const MigratedDocument = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  kind: z.enum(['certificate', 'declaration', 'attestation', 'policy', 'diploma', 'patent', 'manual', 'method', 'form', 'catalog', 'other']),
  scope: z.enum(['pressure', 'temperature', 'general']),
  categorySlugs: z.array(z.string()),
  date: z.string(),
  file: FileRef,
  preview: localPath.nullable(),
  sourceUrl: z.string().url(),
})

export const MigratedPage = z.object({
  slug: z.string(),
  title: z.string(),
  group: z.enum(['page', 'support', 'vacancy', 'press']),
  date: z.string(),
  html: z.string(),
  images: z.array(localPath),
  sourceUrl: z.string().url(),
})

export const Contacts = z.object({
  phone: z.string(),
  email: z.string().email(),
  postcode: z.string(),
  address: z.string(),
  legalName: z.string(),
})

export type FileRef = z.infer<typeof FileRef>
export type Attribute = z.infer<typeof Attribute>
export type CategoryNode = z.infer<typeof CategoryNode>
export type MigratedProduct = z.infer<typeof MigratedProduct>
export type MigratedProject = z.infer<typeof MigratedProject>
export type MigratedReview = z.infer<typeof MigratedReview>
export type MigratedDocument = z.infer<typeof MigratedDocument>
export type MigratedPage = z.infer<typeof MigratedPage>
