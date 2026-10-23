import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { q } from '@/api/queries'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Accordion } from '@/components/ui/Accordion'
import { Async } from '@/components/ui/Async'
import { Prose } from '@/components/ui/Prose'
import { PageHeader } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/States'

export const Route = createFileRoute('/vacancies')({ component: Vacancies })

function Vacancies() {
  const query = useQuery(q.pages('vacancy'))
  return (
    <>
      <PageHeader title="Вакансии" lead="Открытые позиции «ВакууммашЭлектро»."><Breadcrumbs items={[{ label: 'Вакансии' }]} /></PageHeader>
      <div className="container-page max-w-4xl py-10">
        <Async query={query} skeleton={<Skeleton className="h-64" />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="Сейчас открытых вакансий нет" />}>
          {(list) => <Accordion items={list.map((v) => ({ id: v.slug, title: v.title, content: <Prose html={v.html} /> }))} />}
        </Async>
      </div>
    </>
  )
}
