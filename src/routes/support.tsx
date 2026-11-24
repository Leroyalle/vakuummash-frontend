import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useDeferredValue, useState } from 'react'
import { q } from '@/api/queries'
import { Prose } from '@/components/ui/Prose'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { LeadForm } from '@/components/forms/LeadForm'
import { Async } from '@/components/ui/Async'
import { Accordion } from '@/components/ui/Accordion'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { PageHeader, SectionHead } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'
import { buttonClass } from '@/components/ui/buttonStyles'

export const Route = createFileRoute('/support')({ component: Support })

function Support() {
  const [search, setSearch] = useState('')
  const [code, setCode] = useState('')
  const faq = useQuery(q.faq())
  const center = useQuery(q.pages('support'))

  const term = useDeferredValue(code.trim())
  const lookup = useQuery({ ...q.products({ q: term, perPage: 6 }), enabled: term.length >= 2 })
  const found = term.length >= 2 ? (lookup.data?.items ?? []) : []

  const needle = search.trim().toLowerCase()

  return (
    <>
      <PageHeader title="Поддержка" lead="Ответы на вопросы, инструкции, идентификация продукции и сервисные услуги.">
        <Breadcrumbs items={[{ label: 'Поддержка' }]} />
      </PageHeader>
      {(faq.data?.length ?? 0) > 0 && (
        <div className="container-page pt-8">
          <form role="search" onSubmit={(e) => e.preventDefault()} className="max-w-xl">
            <Input aria-label="Поиск по вопросам" type="search" placeholder="Поиск по вопросам" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
        </div>
      )}

      <section id="services" className="container-page section scroll-mt-32">
        <SectionHead title="Гарантия и программное обеспечение" />
        <Async query={center} skeleton={<Skeleton className="h-40" />} isEmpty={(d) => d.length === 0}>
          {(list) => <Accordion items={list.map((i) => ({ id: i.slug, title: i.title, content: <Prose html={i.html} /> }))} />}
        </Async>
      </section>

      {(faq.data?.length ?? 0) > 0 && (
      <section id="faq" className="container-page section scroll-mt-32">
        <SectionHead title="Частые вопросы" />
        <Async query={faq} skeleton={<Skeleton className="h-64" />} isEmpty={(d) => d.length === 0}>
          {(list) => {
            const f = list.filter((i) => !needle || `${i.q} ${i.a}`.toLowerCase().includes(needle))
            return f.length ? <Accordion items={f.map((i) => ({ id: i.id, title: i.q, content: i.a }))} /> : <p role="status" className="rounded-md border border-dashed border-ink-300 p-8 text-center text-ink-600">По запросу «{search}» ничего не найдено.</p>
          }}
        </Async>
      </section>
      )}

      <section id="identify" className="container-page section scroll-mt-32">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHead title="Идентификация продукции" lead="Введите обозначение с таблички на корпусе (или его часть) — найдём модель в каталоге." />
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2"><Input aria-label="Обозначение с шильдика" placeholder="например, ТПП" className="font-mono" value={code} onChange={(e) => setCode(e.target.value)} /></form>
            {code.trim().length >= 2 && (
              <div role="status" className="mt-4 text-sm">
                {found.length ? (
                  <ul className="space-y-1">{found.map((p) => <li key={p.id}><Link to="/catalog/$category/$productId" params={{ category: p.category, productId: p.id }} className="font-medium text-brand-700 underline">{p.name}</Link></li>)}</ul>
                ) : <p className="rounded-md border border-danger/30 bg-danger/5 p-4">Ничего не найдено. Отправьте фото шильдика через форму обращения.</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="request" className="container-page section scroll-mt-32">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1fr_1.3fr]">
          <div><SectionHead title="Обращение в техподдержку" lead="Опишите проблему или вопрос — инженер ответит по e-mail или перезвонит." /><Link to="/contacts" className={buttonClass('outline', 'md')}>Другие способы связи</Link></div>
          <Card className="p-6"><LeadForm kind="support" fields={['name', 'company', 'phone', 'email', 'comment']} required={['name', 'phone', 'email', 'comment']} commentLabel="Суть обращения" submitLabel="Отправить обращение" successTitle="Обращение зарегистрировано" /></Card>
        </div>
      </section>
    </>
  )
}
