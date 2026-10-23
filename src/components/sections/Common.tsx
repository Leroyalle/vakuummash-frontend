import { Link } from '@tanstack/react-router'
import { FileImage, Mail, Phone, Quote } from 'lucide-react'
import { useState } from 'react'
import { COMPANY } from '@/config'
import type { MigratedReview } from '@/data/schema'
import type { Staff } from '@/data/mocks'
import { Prose } from '@/components/ui/Prose'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useModals } from '@/components/forms/ModalsContext'

export function ReviewCard({ r }: { r: MigratedReview }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="flex h-full flex-col p-6">
      <Quote className="size-7 text-accent-500" aria-hidden />
      <p className="mt-3 font-semibold text-brand-900">{r.company}</p>
      {r.industry && <p className="mt-0.5 font-mono text-xs text-ink-500">{r.industry}</p>}
      <div className={open ? 'mt-3' : 'relative mt-3 max-h-40 overflow-hidden'}>
        <Prose html={r.html} className="text-sm" />
        {!open && <div aria-hidden className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {r.html.length > 300 && <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="font-medium text-brand-700 hover:text-accent-700">{open ? 'Свернуть' : 'Читать полностью'}</button>}
        {r.image && <a href={r.image} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-600 hover:text-accent-700"><FileImage className="size-4" aria-hidden />Скан письма</a>}
      </div>
    </Card>
  )
}

export function StaffCard({ s }: { s: Staff }) {
  const initials = s.name.split(' ').map((x) => x[0]).join('')
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-900 font-semibold text-white">{initials}</span>
        <div><p className="font-semibold text-brand-900">{s.name}</p><p className="text-sm text-ink-600">{s.role}</p></div>
      </div>
      <p className="mt-4 text-sm"><span className="text-ink-500">Отвечает за: </span>{s.area}</p>
      <div className="mt-3 space-y-1 text-sm">
        <a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 hover:text-accent-700"><Phone className="size-4 text-ink-500" aria-hidden />{s.phone}</a>
        <a href={`mailto:${s.email}`} className="flex items-center gap-2 hover:text-accent-700"><Mail className="size-4 text-ink-500" aria-hidden />{s.email}</a>
      </div>
    </Card>
  )
}

export const CardsSkeleton = ({ n = 3, h = 'h-48' }: { n?: number; h?: string }) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: n }).map((_, i) => <Skeleton key={i} className={h} />)}</div>
)

export function ConsultBlock() {
  const { openCallback } = useModals()
  return (
    <section className="bg-brand-900 text-white grid-bg">
      <div className="container-page flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-14">
        <div className="max-w-xl">
          <h2 className="text-2xl text-white md:text-3xl">Нужна консультация?</h2>
          <p className="mt-2 text-brand-100">Инженеры подберут датчик под вашу задачу, подготовят опросный лист и коммерческое предложение. Телефон: {COMPANY.phone}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={openCallback}>Заказать звонок</Button>
          <Link to="/support" className={buttonClass('light', 'lg')}>Задать вопрос</Link>
        </div>
      </div>
    </section>
  )
}
