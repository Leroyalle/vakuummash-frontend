import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { q } from '@/api/queries'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ConsultBlock } from '@/components/sections/Common'
import { Async } from '@/components/ui/Async'
import { Badge } from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Prose } from '@/components/ui/Prose'
import { PageHeader } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'

export const Route = createFileRoute('/projects/$slug')({ component: ProjectPage })

function ProjectPage() {
  const { slug } = Route.useParams()
  const query = useQuery(q.project(slug))
  return (
    <Async query={query} skeleton={<div className="container-page space-y-4 py-12"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64" /></div>}>
      {(p) => !p ? (
        <div className="container-page py-20 text-center"><h1 className="text-3xl">Проект не найден</h1><Link to="/projects" className={buttonClass('primary', 'lg', 'mt-6')}>К списку проектов</Link></div>
      ) : (
        <>
          <PageHeader title={p.title} lead={p.region ?? undefined}>
            <Breadcrumbs items={[{ label: 'Проекты', link: { to: '/projects' } }, { label: p.title }]} />
          </PageHeader>
          <div className="container-page py-10">
            {p.importSubstitution && <Badge tone="accent" className="mb-4">По импортозамещению</Badge>}
            <Prose html={p.html} className="mb-6 max-w-3xl" />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.images.map((src, i) => (
                <li key={src}><a href={src} target="_blank" rel="noreferrer"><img src={src} alt={`${p.title}, фото ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full rounded-md border border-ink-200 object-cover" /></a></li>
              ))}
            </ul>
          </div>
          <ConsultBlock />
        </>
      )}
    </Async>
  )
}
