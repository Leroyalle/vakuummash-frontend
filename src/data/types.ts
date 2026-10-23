import type { ConfigSchema } from '@/configurator/types'
import type { Attribute, FileRef } from './schema'
import type { FamilyContent } from './structure-schema'

export type CategoryId = string

export type Category = {
  id: CategoryId
  name: string
  count: number
  icon: 'gauge' | 'thermo' | 'valve' | 'plug'
  subcategories: { id: string; name: string; count: number }[]
}

/** Семейство товаров: одна страница, модификации задаются конфигуратором. */
export type Product = {
  id: string
  category: CategoryId
  sub: { id: string; name: string } | null
  name: string
  short: string
  images: string[]
  /** параметры семейства (из опций конфигуратора) — основа фильтров каталога */
  attributes: Attribute[]
  /** ключевые параметры для бейджей на карточке */
  badges: string[]
  content: FamilyContent
  /** исходный текст страницы со старого сайта */
  legacyText: string
  documents: FileRef[]
  /** null — цена не опубликована, работает режим «по запросу» */
  price: number | null
  /** конфигуратор есть только у семейств, где источник описывает несколько модификаций */
  schema?: ConfigSchema
}
