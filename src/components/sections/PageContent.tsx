import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ReadingProgress } from '@/components/motion/ReadingProgress'
import { q } from '@/api/queries'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Async } from '@/components/ui/Async'
import { Prose } from '@/components/ui/Prose'
import { PageHeader } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/States'

/** Страница со статичным контентом, перенесённым со старого сайта. */
export function PageContent({ slug, title, crumb, children }: { slug: string; title: string; crumb?: string; children?: ReactNode }) {
  const query = useQuery(q.page(slug))
  return (
    <>
      <ReadingProgress />
      <PageHeader title={title}><Breadcrumbs items={[{ label: crumb ?? title }]} /></PageHeader>
      <div className="container-page py-10">
        <Async query={query} skeleton={<div className="space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-40" /></div>}>
          {(p) => (p && p.html ? <Prose html={p.html} className="max-w-4xl" /> : <EmptyState title="Раздел наполняется" text="Содержимое этой страницы на старом сайте пустое." />)}
        </Async>
        {children}
      </div>
    </>
  )
}
