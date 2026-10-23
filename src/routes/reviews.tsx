import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { q } from '@/api/queries'
import { industries } from '@/data'
import { cn } from '@/lib/cn'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { CardsSkeleton, ConsultBlock, ReviewCard } from '@/components/sections/Common'
import { Async } from '@/components/ui/Async'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/Section'
import { EmptyState } from '@/components/ui/States'

export const Route = createFileRoute('/reviews')({
  validateSearch: z.object({ industry: z.string().optional().catch(undefined) }),
  component: Reviews,
})

const STEP = 12

function Reviews() {
  const { industry } = Route.useSearch()
  const reviews = useQuery(q.reviews())
  const [shown, setShown] = useState(STEP)
  return (
    <>
      <PageHeader title="Отзывы" lead="Благодарственные письма и отзывы клиентов.">
        <Breadcrumbs items={[{ label: 'Отзывы' }]} />
      </PageHeader>
      <div className="container-page py-10">
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Отрасль">
          {[{ name: 'Все отзывы', count: 0 }, ...industries].map((i) => {
            const on = (industry ?? 'Все отзывы') === i.name
            return <Link key={i.name} to="/reviews" search={i.count ? { industry: i.name } : {}} aria-current={on ? 'true' : undefined} onClick={() => setShown(STEP)}
              className={cn('rounded-full border px-4 py-1.5 text-sm', on ? 'border-brand-900 bg-brand-900 text-white' : 'border-ink-300 hover:border-accent-500')}>{i.name}</Link>
          })}
        </div>
        <Async query={reviews} skeleton={<CardsSkeleton n={6} h="h-56" />} isEmpty={(d) => d.length === 0}>
          {(all) => {
            const list = all.filter((r) => !industry || r.industry === industry)
            if (!list.length) return <EmptyState text="Для этой отрасли отзывов пока нет." />
            return (
              <>
                <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">{list.slice(0, shown).map((r) => <ReviewCard key={r.id} r={r} />)}</div>
                {shown < list.length && <div className="mt-8 text-center"><Button variant="outline" onClick={() => setShown((n) => n + STEP)}>Показать ещё ({list.length - shown})</Button></div>}
              </>
            )
          }}
        </Async>
      </div>
      <ConsultBlock />
    </>
  )
}
