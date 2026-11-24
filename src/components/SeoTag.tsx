import { useSeo, type Seo } from '@/lib/seo'

/** Декларативная версия useSeo: можно вставить внутрь render-функции Async. */
export function SeoTag(props: Seo) {
  useSeo(props)
  return null
}
