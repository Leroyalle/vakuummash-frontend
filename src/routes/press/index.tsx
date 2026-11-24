import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { q } from '@/api/queries'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { CardsSkeleton } from '@/components/sections/Common'
import { Async } from '@/components/ui/Async'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/Section'
import { excerpt } from '@/lib/seo'

export const Route = createFileRoute('/press/')({ component: Press })

const STEP = 20
const dayMonth = (iso: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(iso))

function Press() {
  const query = useQuery(q.pages('press'))
  const [shown, setShown] = useState(STEP)
  return (
    <>
      <PageHeader title="Новости" lead="События компании, выставки и материалы по продукции."><Breadcrumbs items={[{ label: 'Новости' }]} /></PageHeader>
      <div className="container-page py-10">
        <Async query={query} skeleton={<CardsSkeleton n={6} h="h-24" />} isEmpty={(d) => d.length === 0}>
          {(list) => {
            const visible = list.slice(0, shown)
            const years = [...new Set(visible.map((p) => new Date(p.date).getFullYear()))]
            return (
              <>
                {years.map((y) => (
                  <section key={y} aria-labelledby={`y-${y}`} className="grid gap-x-10 border-t-2 border-brand-900 pt-4 pb-10 lg:grid-cols-[10rem_1fr]">
                    <h2 id={`y-${y}`} className="text-4xl text-brand-900 lg:sticky lg:top-32 lg:self-start">{y}</h2>
                    <ul>
                      {visible.filter((p) => new Date(p.date).getFullYear() === y).map((p) => {
                        const text = excerpt(p.html, 180)
                        return (
                          <li key={p.slug} className="border-b border-ink-200 last:border-0">
                            <Link to="/press/$slug" params={{ slug: p.slug }} className="group grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[8rem_1fr_auto]">
                              <time dateTime={p.date} className="pt-1 text-[0.9375rem] text-ink-600">{dayMonth(p.date)}</time>
                              <span className="min-w-0">
                                <span className="block font-display text-xl font-semibold leading-snug text-brand-900 group-hover:text-brand-700 md:text-2xl">{p.title}</span>
                                {text && text !== p.title && <span className="mt-1.5 line-clamp-2 max-w-3xl text-[0.9375rem] leading-relaxed text-ink-600">{text}</span>}
                              </span>
                              {p.images[0] && <img src={p.images[0]} alt="" loading="lazy" className="hidden h-24 w-36 border border-ink-200 bg-white object-cover sm:block" />}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
                {shown < list.length && <div className="text-center"><Button variant="outline" onClick={() => setShown((n) => n + STEP)}>Показать ещё ({list.length - shown})</Button></div>}
              </>
            )
          }}
        </Async>
      </div>
    </>
  )
}
