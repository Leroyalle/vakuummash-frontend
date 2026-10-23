import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ReadingProgress } from '@/components/motion/ReadingProgress'
import { q } from '@/api/queries'
import { dateRu } from '@/lib/format'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Async } from '@/components/ui/Async'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Prose } from '@/components/ui/Prose'
import { PageHeader } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'

export const Route = createFileRoute('/press/$slug')({ component: Article })

function Article() {
  const { slug } = Route.useParams()
  const query = useQuery(q.page(slug))
  return (
    <Async query={query} skeleton={<div className="container-page py-12"><Skeleton className="h-64" /></div>}>
      {(p) => !p || p.group !== 'press' ? (
        <div className="container-page py-20 text-center"><h1 className="text-3xl">Материал не найден</h1><Link to="/press" className={buttonClass('primary', 'lg', 'mt-6')}>В пресс-центр</Link></div>
      ) : (
        <>
          <ReadingProgress />
          <PageHeader title={p.title} lead={dateRu(p.date)}><Breadcrumbs items={[{ label: 'Пресс-центр', link: { to: '/press' } }, { label: p.title }]} /></PageHeader>
          <div className="container-page py-10"><Prose html={p.html} className="max-w-3xl" /></div>
        </>
      )}
    </Async>
  )
}
