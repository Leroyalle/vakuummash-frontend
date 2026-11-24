import { Link } from '@tanstack/react-router'
import { FileImage } from 'lucide-react'
import { useState } from 'react'
import { COMPANY } from '@/config'
import type { MigratedReview } from '@/data/schema'
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
      <p className="font-display text-xl font-semibold text-brand-900">{r.company}</p>
      {r.industry && <p className="mt-0.5 text-sm text-ink-500">{r.industry}</p>}
      <div className={open ? 'mt-3' : 'mt-3 max-h-36 overflow-hidden'}>
        <Prose html={open ? r.html : r.html.replace(/^\s*<p>\s*(?:<[^>]+>)*(?:Уважаем|Здравствуйте)[^<]*(?:<[^>]+>)*\s*<\/p>/i, '')} className="text-[0.9375rem]" />
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-sm">
        {r.html.length > 300 && <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-700">{open ? 'Свернуть' : 'Читать полностью'}</button>}
        {r.image && <a href={r.image} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-600 hover:text-brand-700"><FileImage className="size-4" aria-hidden />Скан письма</a>}
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
    <section className="bg-brand-800 text-white">
      <div className="container-page flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
        <div className="max-w-xl">
          <h2 className="text-3xl text-white">Нужна консультация?</h2>
          <p className="mt-2 text-brand-100">Инженеры подберут датчик под вашу задачу, подготовят опросный лист и коммерческое предложение. Телефон: {COMPANY.phone}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={openCallback}>Заказать звонок</Button>
          <Link to="/support" className={buttonClass('outline', 'lg', 'border-white text-white hover:bg-white hover:text-brand-900')}>Задать вопрос</Link>
        </div>
      </div>
    </section>
  )
}
