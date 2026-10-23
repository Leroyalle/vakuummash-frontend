import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { q } from '@/api/queries'
import { dateRu } from '@/lib/format'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { CardsSkeleton } from '@/components/sections/Common'
import { Async } from '@/components/ui/Async'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/Section'

export const Route = createFileRoute('/press/')({ component: Press })

const STEP = 12

function Press() {
  const query = useQuery(q.pages('press'))
  const [shown, setShown] = useState(STEP)
  return (
    <>
      <PageHeader title="Пресс-центр" lead="Новости, события и статьи."><Breadcrumbs items={[{ label: 'Пресс-центр' }]} /></PageHeader>
      <div className="container-page py-10">
        <Async query={query} skeleton={<CardsSkeleton n={6} h="h-32" />} isEmpty={(d) => d.length === 0}>
          {(list) => (
            <>
              <ul className="grid gap-4 md:grid-cols-2">
                {list.slice(0, shown).map((p) => (
                  <li key={p.slug}>
                    <Link to="/press/$slug" params={{ slug: p.slug }} className="flex h-full gap-4 rounded-md border border-ink-200 p-4 transition-colors hover:border-accent-500">
                      {p.images[0] && <img src={p.images[0]} alt="" loading="lazy" className="size-20 shrink-0 rounded-sm object-cover" />}
                      <span><span className="block font-mono text-xs text-ink-500">{dateRu(p.date)}</span><span className="mt-1 block font-semibold text-brand-900">{p.title}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
              {shown < list.length && <div className="mt-8 text-center"><Button variant="outline" onClick={() => setShown((n) => n + STEP)}>Показать ещё ({list.length - shown})</Button></div>}
            </>
          )}
        </Async>
      </div>
    </>
  )
}
