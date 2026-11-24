import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { q } from '@/api/queries'
import { useModals } from '@/components/forms/ModalsContext'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Async } from '@/components/ui/Async'
import { Button } from '@/components/ui/Button'
import { Prose } from '@/components/ui/Prose'
import { PageHeader } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'

export const Route = createFileRoute('/about')({ component: About })

/** Подтверждённые факты (текст «О компании» и сертификат ГОСТ Р ИСО 9001-2015). */
const FACTS = [
  { v: '2015', l: 'год основания, Сарапул' },
  { v: '1000+', l: 'модификаций приборов' },
  { v: 'от 1 шт.', l: 'минимальная партия' },
  { v: '5 лет', l: 'межповерочный интервал' },
  { v: '12+ лет', l: 'срок службы изделий' },
  { v: '7 дней', l: 'замена брака, рабочих' },
]

function About() {
  const { openCallback } = useModals()
  const page = useQuery(q.page('about'))
  const docs = useQuery(q.documents())
  const certs = (docs.data ?? []).filter((d) => d.kind === 'certificate' && d.preview?.endsWith('.webp')).slice(0, 8)

  return (
    <>
      <PageHeader title="О заводе" lead="Производственный комплекс в Сарапуле: датчики давления и температуры, клапанные блоки и измерительные преобразователи."><Breadcrumbs items={[{ label: 'О заводе' }]} /></PageHeader>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_20rem]">
        <article className="min-w-0">
          <Async query={page} skeleton={<div className="space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-64" /></div>}>
            {(p) => <Prose html={p?.html ?? ''} className="about-prose text-[1.0625rem] leading-[1.7]" />}
          </Async>
        </article>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <dl className="grid grid-cols-2 gap-px border border-ink-200 bg-ink-200">
            {FACTS.map((f) => (
              <div key={f.l} className="bg-white p-4">
                <dd className="font-display text-2xl font-semibold text-brand-900">{f.v}</dd>
                <dt className="mt-0.5 text-sm text-ink-600">{f.l}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-4 border border-ink-200 bg-ink-50 p-4">
            <p className="text-[0.9375rem] text-ink-800">Подберём датчик под задачу и подготовим коммерческое предложение.</p>
            <Button className="mt-3 w-full" onClick={openCallback}>Заказать звонок</Button>
          </div>
          <nav aria-label="Ещё о заводе" className="mt-4">
            {[['/projects', 'Реализованные проекты'], ['/reviews', 'Отзывы клиентов'], ['/press', 'Новости'], ['/vacancies', 'Вакансии'], ['/delivery', 'Доставка']].map(([to, l]) => (
              <Link key={to} to={to} className="block border-b border-ink-200 py-2.5 text-[0.9375rem] font-medium text-brand-900 hover:text-brand-700">{l}</Link>
            ))}
          </nav>
        </aside>
      </div>

      {certs.length > 0 && (
        <section className="bg-ink-50">
          <div className="container-page section">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-ink-200 pb-4">
              <h2 className="text-3xl md:text-4xl">Сертификаты</h2>
              <Link to="/docs" search={{ type: 'certificate' }} className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-900">Все документы</Link>
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {certs.map((c) => (
                <li key={c.slug}>
                  <a href={c.file.url} target="_blank" rel="noreferrer" className="group block">
                    <img src={c.preview ?? ''} alt={c.title} loading="lazy" className="aspect-[3/4] w-full border border-ink-200 bg-white object-cover object-top group-hover:border-brand-500" />
                    <span className="mt-2 line-clamp-2 text-sm leading-snug text-ink-800 group-hover:text-brand-700">{c.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
