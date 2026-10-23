import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { z } from 'zod'
import { q } from '@/api/queries'
import { cn } from '@/lib/cn'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { CardsSkeleton } from '@/components/sections/Common'
import { Async } from '@/components/ui/Async'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/Section'
import { EmptyState } from '@/components/ui/States'

export const Route = createFileRoute('/projects/')({
  validateSearch: z.object({ import: z.boolean().optional().catch(undefined) }),
  component: Projects,
})

function Projects() {
  const { import: onlyImport } = Route.useSearch()
  const projects = useQuery(q.projects())
  return (
    <>
      <PageHeader title="Проекты" lead="Объекты, на которые поставлено наше оборудование.">
        <Breadcrumbs items={[{ label: 'Проекты' }]} />
      </PageHeader>
      <div className="container-page py-8">
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Рубрика">
          {[{ label: 'Все проекты', on: !onlyImport, search: {} }, { label: 'По импортозамещению', on: !!onlyImport, search: { import: true } }].map((c) => (
            <Link key={c.label} to="/projects" search={c.search} aria-current={c.on ? 'true' : undefined}
              className={cn('rounded-full border px-4 py-1.5 text-sm', c.on ? 'border-brand-900 bg-brand-900 text-white' : 'border-ink-300 hover:border-accent-500')}>{c.label}</Link>
          ))}
        </div>
        <Async query={projects} skeleton={<CardsSkeleton n={6} h="h-56" />} isEmpty={(d) => d.length === 0}>
          {(all) => {
            const list = all.filter((p) => !onlyImport || p.importSubstitution)
            if (!list.length) return <EmptyState text="В этой рубрике пока нет проектов." />
            return (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {list.map((p) => (
                  <Link key={p.slug} to="/projects/$slug" params={{ slug: p.slug }} className="group flex flex-col overflow-hidden rounded-md border border-ink-200 transition-shadow hover:shadow-md">
                    {p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" className="h-48 w-full object-cover" /> : <div className="h-48 bg-ink-100" />}
                    <div className="flex flex-1 flex-col p-5">
                      {p.importSubstitution && <Badge tone="accent" className="self-start">По импортозамещению</Badge>}
                      <h2 className="mt-2 text-lg group-hover:text-accent-700">{p.title}</h2>
                      {p.region && <p className="mt-1 text-sm text-ink-500">{p.region}</p>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-brand-700 group-hover:text-accent-700">Подробнее<ArrowRight className="size-4" aria-hidden /></span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          }}
        </Async>
      </div>
    </>
  )
}
