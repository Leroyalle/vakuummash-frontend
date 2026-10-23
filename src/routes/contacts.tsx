import { createFileRoute } from '@tanstack/react-router'
import { Mail, MapPin, Phone } from 'lucide-react'
import { COMPANY } from '@/config'
import { LeadForm } from '@/components/forms/LeadForm'
import { PageContent } from '@/components/sections/PageContent'
import { Card } from '@/components/ui/Card'
import { SectionHead } from '@/components/ui/Section'

export const Route = createFileRoute('/contacts')({ component: Contacts })

function Contacts() {
  const items = [
    { i: Phone, t: 'Телефон', v: <a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`}>{COMPANY.phone}</a> },
    { i: Mail, t: 'E-mail', v: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> },
    { i: MapPin, t: 'Адрес', v: COMPANY.address },
  ]
  return (
    <>
      <PageContent slug="contacts" title="Контакты">
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {items.map((c) => <li key={c.t} className="rounded-md border border-ink-200 p-5"><c.i className="size-5 text-accent-600" aria-hidden /><p className="mt-2 text-sm text-ink-500">{c.t}</p><p className="mt-0.5 font-medium text-brand-900">{c.v}</p></li>)}
        </ul>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div role="img" aria-label="Заглушка карты" className="relative grid min-h-72 place-items-center overflow-hidden rounded-md border border-ink-200 bg-ink-100">
            <svg className="absolute inset-0 size-full" aria-hidden><defs><pattern id="mp" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#c3cfdd" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#mp)" /><path d="M0 180 Q160 120 300 170 T640 140" stroke="#fff" strokeWidth="14" fill="none" /></svg>
            <span className="relative grid place-items-center gap-1 px-4 text-center"><MapPin className="size-10 text-accent-600" aria-hidden /><span className="rounded-sm bg-white px-3 py-1 text-sm font-medium shadow">{COMPANY.address}</span></span>
          </div>
          <Card className="p-6 md:p-8"><h2 className="text-xl">Напишите нам</h2><p className="mb-5 mt-1 text-sm text-ink-600">Макет формы: данные никуда не отправляются.</p>
            <LeadForm fields={['name', 'company', 'phone', 'email', 'comment']} required={['name', 'phone', 'email', 'comment']} submitLabel="Отправить сообщение" successTitle="Сообщение отправлено" /></Card>
        </div>
        <section id="dealer" className="mt-16 scroll-mt-24">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1fr_1.3fr]">
            <SectionHead eyebrow="Сотрудничество" title="Стать дилером" lead="Оставьте заявку — менеджер свяжется и расскажет об условиях." />
            <Card className="p-6"><LeadForm fields={['name', 'company', 'phone', 'email', 'comment']} required={['name', 'company', 'phone', 'email']} commentLabel="Регион и профиль деятельности" submitLabel="Подать заявку" successTitle="Заявка принята" /></Card>
          </div>
        </section>
      </PageContent>
    </>
  )
}
