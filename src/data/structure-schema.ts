import { z } from 'zod'

/** Схемы данных, получаемых скриптами scripts/structure (семейства товаров и их конфигурации). */
export const ConfigOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  /** фрагмент артикула (пустая строка — позиция опускается) */
  codePart: z.string(),
  priceDelta: z.number().optional(),
  spec: z.record(z.string(), z.string()).optional(),
  /** true — значение/код не подтверждены источником, вынесены в отчёт */
  unverified: z.boolean().optional(),
})

export const ConfigFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  hint: z.string().optional(),
  default: z.string(),
  options: z.array(ConfigOptionSchema).min(1),
})

export const ConfigRuleSchema = z.object({
  when: z.object({ field: z.string(), in: z.array(z.string()).min(1) }),
  disable: z.object({ field: z.string(), values: z.array(z.string()).min(1) }),
  reason: z.string(),
})

export const ConfigFileSchema = z.object({
  fields: z.array(ConfigFieldSchema).min(1),
  rules: z.array(ConfigRuleSchema),
  codeTemplate: z.string(),
  basePrice: z.number(),
})

export const FamilySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  /** слаги исходных страниц, объединённых в семейство */
  sourceSlugs: z.array(z.string()).min(1),
  images: z.array(z.string()),
  legacyText: z.string(),
  /** признаки для бейджей и фильтров (из опций) */
  keyParams: z.record(z.string(), z.array(z.string())),
})

export type ConfigFile = z.infer<typeof ConfigFileSchema>
export type Family = z.infer<typeof FamilySchema>

export const FamilyContentSchema = z.object({
  summary: z.string(),
  standard: z.string().nullable(),
  applications: z.array(z.string()),
  advantages: z.array(z.string()),
  /** страницы-источники с таблицами характеристик и схемой заказа */
  pages: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    specGroups: z.array(z.object({ title: z.string(), html: z.string() })),
    orderHtml: z.string(),
    /** текст, который не удалось отнести ни к одному блоку */
    rest: z.string(),
  })),
})
export type FamilyContent = z.infer<typeof FamilyContentSchema>
