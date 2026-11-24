import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { q } from '@/api/queries'
import { LeadForm } from '@/components/forms/LeadForm'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Prose } from '@/components/ui/Prose'
import { PageHeader } from '@/components/ui/Section'
import { COMPANY } from '@/config'

export const Route = createFileRoute('/contacts')({ component: Contacts })

const tel = (s: string) => `tel:${s.replace(/[^\d+]/g, '')}`

/** Контакты: главное (телефон, почта, адрес) крупно и сразу, рядом форма; отделы из админки — ниже, отдельным блоком. */
function Contacts() {
  const page = useQuery(q.page('contacts'))
  return (
    <>
      <PageHeader title="Контакты"><Breadcrumbs items={[{ label: 'Контакты' }]} /></PageHeader>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <dl className="border-t-2 border-brand-900">
            <div className="border-b border-ink-200 py-6">
              <dt className="text-ink-600">Телефон</dt>
              <dd className="mt-1"><a href={tel(COMPANY.phone)} className="font-display text-4xl font-bold text-brand-900 hover:text-brand-700">{COMPANY.phone}</a></dd>
            </div>
            <div className="border-b border-ink-200 py-6">
              <dt className="text-ink-600">E-mail</dt>
              <dd className="mt-1"><a href={`mailto:${COMPANY.email}`} className="font-display text-2xl font-bold text-brand-900 hover:text-brand-700">{COMPANY.email}</a></dd>
            </div>
            <div className="border-b border-ink-200 py-6">
              <dt className="text-ink-600">Адрес завода</dt>
              <dd className="mt-1 max-w-md text-xl leading-snug font-medium text-brand-900">{COMPANY.address}</dd>
              <dd className="mt-3"><a href={`https://yandex.ru/maps/?text=${encodeURIComponent(COMPANY.address)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-700 underline underline-offset-4 hover:text-brand-900"><MapPin className="size-4" aria-hidden />Открыть на Яндекс Картах</a></dd>
            </div>
          </dl>
        </div>
        <div className="border border-ink-200 bg-ink-50 p-6 md:p-8">
          <h2 className="text-3xl">Напишите нам</h2>
          <p className="mt-2 mb-6 text-[1.0625rem] text-ink-700">Опишите вопрос или задачу — ответим по e-mail или перезвоним.</p>
          <LeadForm kind="contact" fields={['name', 'company', 'phone', 'email', 'comment']} required={['name', 'phone', 'email', 'comment']} submitLabel="Отправить сообщение" successTitle="Сообщение отправлено" />
        </div>
      </div>

      {/* Отделы и сотрудники — текст страницы «Контакты» из админки */}
      {page.data?.html && (
        <section className="bg-ink-50">
          <div className="container-page section">
            <h2 className="mb-8 text-4xl">Отделы</h2>
            <Prose html={page.data.html} className="contacts-prose text-[1.0625rem]" />
          </div>
        </section>
      )}

      <section id="dealer" className="scroll-mt-32">
        <div className="container-page section grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-4xl">Стать дилером</h2>
            <p className="mt-3 max-w-md text-[1.0625rem] text-ink-700">Оставьте заявку — менеджер свяжется и расскажет об условиях сотрудничества.</p>
          </div>
          <div className="border border-ink-200 p-6 md:p-8">
            <LeadForm kind="dealer" fields={['name', 'company', 'phone', 'email', 'comment']} required={['name', 'company', 'phone', 'email']} commentLabel="Регион и профиль деятельности" submitLabel="Подать заявку" successTitle="Заявка принята" />
          </div>
        </div>
      </section>
    </>
  )
}
