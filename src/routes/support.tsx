import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Search } from 'lucide-react'
import { Fragment, useDeferredValue, useState } from 'react'
import { q } from '@/api/queries'
import { Prose } from '@/components/ui/Prose'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { LeadForm } from '@/components/forms/LeadForm'
import { Async } from '@/components/ui/Async'
import { Accordion } from '@/components/ui/Accordion'
import { Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'
import { buttonClass } from '@/components/ui/buttonStyles'
import { COMPANY } from '@/config'

export const Route = createFileRoute('/support')({ component: Support })

/** картинка-обложка вынесена в колонку слева, из текста её убираем */
const withoutCover = (html: string) => html.replace(/^\s*<p>\s*<img[^>]*>\s*<\/p>/, '')

const ATTACH = [
  'Обозначение прибора с таблички на корпусе',
  'Заводской номер и год выпуска, если видны',
  'Что произошло: показания, условия, когда началось',
]

function Support() {
  const [search, setSearch] = useState('')
  const [code, setCode] = useState('')
  const faq = useQuery(q.faq())
  const center = useQuery(q.pages('support'))

  const term = useDeferredValue(code.trim())
  const lookup = useQuery({ ...q.products({ q: term, perPage: 6 }), enabled: term.length >= 2 })
  const found = term.length >= 2 ? (lookup.data?.items ?? []) : []

  const needle = search.trim().toLowerCase()
  const faqCount = faq.data?.length ?? 0

  return (
    <>
      <PageHeader title="Поддержка" lead="Помощь по приборам, которые уже работают у вас: поиск по шильдику, гарантия, программное обеспечение и обращение к инженеру.">
        <Breadcrumbs items={[{ label: 'Поддержка' }]} />
      </PageHeader>

      <div className="container-page section grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="min-w-0 space-y-16">
          {/* Поиск прибора по табличке — главный инструмент страницы */}
          <section id="identify" className="scroll-mt-32 bg-brand-800 p-6 text-white md:p-10">
            <h2 className="text-3xl text-white md:text-4xl">Найти прибор по шильдику</h2>
            <p className="mt-2 max-w-xl text-brand-100">Введите обозначение с таблички на корпусе или его начало — покажем модель в каталоге с документацией.</p>
            <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-6 flex h-14 max-w-2xl items-center border-2 border-white bg-white">
              <Search className="ml-4 size-5 shrink-0 text-ink-500" aria-hidden />
              <input
                aria-label="Обозначение с шильдика" placeholder="Например, VMP-ДИ-1160" value={code} onChange={(e) => setCode(e.target.value)}
                autoComplete="off" className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-lg text-ink-800 placeholder:font-sans placeholder:text-base placeholder:text-ink-500 focus:outline-none"
              />
            </form>
            {code.trim().length >= 2 && (
              <div role="status" className="mt-4 max-w-2xl">
                {lookup.isFetching && !lookup.data ? <p className="text-brand-100">Ищем…</p> : found.length ? (
                  <ul className="border-t border-white/20">
                    {found.map((p) => (
                      <li key={p.id} className="border-b border-white/20">
                        <Link to="/catalog/$category/$productId" params={{ category: p.category, productId: p.id }} className="flex items-center justify-between gap-4 py-3 font-medium text-white hover:text-brand-100">
                          {p.name}<ArrowRight className="size-4 shrink-0" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="border border-white/25 px-4 py-3 text-brand-100">
                    Не нашли такое обозначение. <a href="#request" className="font-medium text-white underline underline-offset-4">Отправьте обращение</a> с фото шильдика — определим прибор.
                  </p>
                )}
              </div>
            )}
          </section>

          <section id="services" className="scroll-mt-32">
            <h2 className="border-b border-ink-200 pb-4 text-3xl md:text-4xl">Гарантия и программное обеспечение</h2>
            <Async query={center} skeleton={<Skeleton className="mt-6 h-64" />} isEmpty={(d) => d.length === 0}>
              {(list) => (
                <div className="divide-y divide-ink-200">
                  {list.map((p) => (
                    <article key={p.slug} id={p.slug} className="grid scroll-mt-32 gap-6 py-8 md:grid-cols-[11rem_minmax(0,1fr)]">
                      {p.images[0] ? <img src={p.images[0]} alt="" className="aspect-square w-32 border border-ink-200 object-cover md:w-full" /> : <span className="hidden md:block" />}
                      <div className="min-w-0">
                        <h3 className="text-2xl">{p.title}</h3>
                        <Prose html={withoutCover(p.html)} className="mt-3 max-w-[70ch]" />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Async>
          </section>

          {faqCount > 0 && (
            <section id="faq" className="scroll-mt-32">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-ink-200 pb-4">
                <h2 className="text-3xl md:text-4xl">Частые вопросы</h2>
                {faqCount > 5 && (
                  <form role="search" onSubmit={(e) => e.preventDefault()} className="w-full sm:w-72">
                    <Input aria-label="Поиск по вопросам" type="search" placeholder="Поиск по вопросам" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </form>
                )}
              </div>
              <Async query={faq} skeleton={<Skeleton className="h-64" />} isEmpty={(d) => d.length === 0}>
                {(list) => {
                  const f = list.filter((i) => !needle || `${i.q} ${i.a}`.toLowerCase().includes(needle))
                  return f.length ? <Accordion items={f.map((i) => ({ id: i.id, title: i.q, content: i.a }))} /> : <p role="status" className="border border-dashed border-ink-300 p-8 text-center text-ink-600">По запросу «{search}» ничего не найдено.</p>
                }}
              </Async>
            </section>
          )}
        </div>

        {/* Контакты техподдержки всегда под рукой */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="border border-ink-200">
            <p className="border-b border-ink-200 bg-ink-50 px-5 py-3 font-display text-lg font-semibold text-brand-900">Техническая поддержка</p>
            <dl className="divide-y divide-ink-200 px-5">
              <div className="py-4">
                <dt className="text-sm text-ink-500">Телефон</dt>
                <dd><a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`} className="font-display text-2xl font-semibold text-brand-900 hover:text-brand-700">{COMPANY.phone}</a></dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-ink-500">E-mail</dt>
                <dd><a href={`mailto:${COMPANY.email}`} className="font-medium text-brand-900 hover:text-brand-700">{COMPANY.email}</a></dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-ink-500">Режим работы</dt>
                <dd className="mt-1 grid grid-cols-[4.5rem_1fr] gap-y-0.5 text-[0.9375rem]">
                  {COMPANY.hours.map(([d, t]) => <Fragment key={d}><span className="text-ink-600">{d}</span><span className="tabular-nums">{t}</span></Fragment>)}
                </dd>
              </div>
            </dl>
            <div className="border-t border-ink-200 p-5">
              <a href="#request" className={buttonClass('primary', 'md', 'w-full')}>Написать обращение</a>
              <nav aria-label="Разделы поддержки" className="mt-5 space-y-2 text-[0.9375rem]">
                <a href="#identify" className="block text-brand-700 hover:text-brand-900">Найти прибор по шильдику</a>
                <a href="#services" className="block text-brand-700 hover:text-brand-900">Гарантия и программное обеспечение</a>
                {faqCount > 0 && <a href="#faq" className="block text-brand-700 hover:text-brand-900">Частые вопросы</a>}
                <Link to="/docs" className="block text-brand-700 hover:text-brand-900">Документация и сертификаты</Link>
              </nav>
            </div>
          </div>
        </aside>
      </div>

      <section id="request" className="scroll-mt-32 border-t border-ink-200 bg-ink-50">
        <div className="container-page section grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <div>
            <h2 className="text-3xl md:text-4xl">Обращение в техподдержку</h2>
            <p className="mt-3 max-w-md text-ink-600">Инженер ответит по e-mail или перезвонит. Чтобы ответ был точным, укажите:</p>
            <ul className="mt-6 border-t border-ink-200">
              {ATTACH.map((t) => <li key={t} className="border-b border-ink-200 py-3 text-ink-800">{t}</li>)}
            </ul>
            <p className="mt-4 text-sm text-ink-600">Фото шильдика можно прислать на <a href={`mailto:${COMPANY.email}`} className="font-medium text-brand-700 underline underline-offset-2">{COMPANY.email}</a>.</p>
          </div>
          <div className="border border-ink-200 bg-white p-6 md:p-8">
            <LeadForm kind="support" layout="grid" fields={['name', 'phone', 'company', 'email', 'comment']} required={['name', 'phone', 'email', 'comment']} commentLabel="Суть обращения" commentPlaceholder="Прибор, обозначение, что случилось" submitLabel="Отправить обращение" successTitle="Обращение зарегистрировано" />
          </div>
        </div>
      </section>
    </>
  )
}
