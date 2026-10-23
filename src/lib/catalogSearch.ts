import { z } from 'zod'

export const catalogSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  /** слаги подкатегорий */
  sub: z.array(z.string()).optional().catch(undefined),
  /** фильтры по атрибутам: { "Выходной сигнал": ["термопара"] } */
  f: z.record(z.string(), z.array(z.string())).optional().catch(undefined),
  sort: z.enum(['default', 'name']).optional().catch(undefined),
  view: z.enum(['grid', 'list']).optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>
