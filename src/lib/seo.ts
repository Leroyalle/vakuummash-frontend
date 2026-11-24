import { useEffect } from 'react'

export const BRAND = 'ВАКУУММАШ-ЭЛЕКТРО'
const DEFAULT_TITLE = `${BRAND} — датчики давления для промышленности`
const DEFAULT_DESCRIPTION = 'Производство и поставка датчиков давления, клапанных блоков и отводов-охладителей, поверка средств измерений. Поставка от 1 штуки. Сарапул.'

export type Seo = {
  /** без суффикса бренда */
  title?: string
  description?: string
  image?: string
  /** noindex для служебных страниц */
  noindex?: boolean
  jsonLd?: object | object[]
}

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
export const excerpt = (html: string, n = 160) => {
  const t = stripHtml(html)
  return t.length <= n ? t : `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…`
}

function meta(attr: 'name' | 'property', key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (content === null) return el?.remove()
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function canonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

const LD_ATTR = 'data-seo-ld'

function apply(s: Seo) {
  const title = s.title ? `${s.title} | ${BRAND}` : DEFAULT_TITLE
  const description = s.description ?? DEFAULT_DESCRIPTION
  // canonical без query: фильтры и сортировка не плодят дубли
  const url = `${window.location.origin}${window.location.pathname}`
  document.title = title
  canonical(url)
  meta('name', 'description', description)
  meta('name', 'robots', s.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
  meta('property', 'og:title', title)
  meta('property', 'og:description', description)
  meta('property', 'og:url', url)
  meta('property', 'og:type', 'website')
  meta('property', 'og:image', s.image ?? null)
  meta('name', 'twitter:card', s.image ? 'summary_large_image' : 'summary')
  meta('name', 'twitter:title', title)
  meta('name', 'twitter:description', description)
  meta('name', 'twitter:image', s.image ?? null)
  document.head.querySelectorAll(`script[${LD_ATTR}]`).forEach((n) => n.remove())
  for (const ld of [s.jsonLd ?? []].flat()) {
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.setAttribute(LD_ATTR, '')
    el.textContent = JSON.stringify(ld).replace(/</g, '\\u003c')
    document.head.appendChild(el)
  }
}

/**
 * Обновляет title, description, canonical, Open Graph и JSON-LD при навигации внутри SPA.
 * Для первой загрузки и роботов то же самое отдаёт сервер (backend/modules/seo).
 * При размонтировании возвращает значения по умолчанию, поэтому страница без вызова не наследует чужой title.
 */
export function useSeo(seo: Seo) {
  const key = JSON.stringify(seo)
  useEffect(() => {
    apply(JSON.parse(key) as Seo)
    return () => apply({})
  }, [key])
}
