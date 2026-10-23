import { Link, type LinkProps } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

export type Crumb = { label: string; link?: LinkProps }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: 'Главная', link: { to: '/' } }, ...items]
  return (
    <nav aria-label="Хлебные крошки">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-brand-100">
        {all.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 opacity-60" aria-hidden />}
            {c.link && i < all.length - 1 ? (
              <Link {...c.link} className="hover:text-white hover:underline">{c.label}</Link>
            ) : (
              <span aria-current="page" className="text-white">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
