import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Boxes, Briefcase, FileText, Newspaper } from 'lucide-react'
import { admin } from '@/api/admin'
import { useAuth } from '@/auth/store'
import { hasRole } from '@/auth/types'
import { Chip, EmptyBlock, PageHead } from '@/components/admin/kit'
import { errorText } from '@/components/admin/primitives'
import { leadKindLabels } from '@/components/admin/labels'
import { buttonClass } from '@/components/ui/buttonStyles'

export const Route = createFileRoute('/admin/')({ component: Home })

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин. назад`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} ч. назад`
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(iso))
}

function Home() {
  const { user } = useAuth()
  const canLeads = hasRole(user, 'manager')
  const canEdit = hasRole(user, 'editor')
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: admin.stats, enabled: canLeads || canEdit })
  const fresh = useQuery({ queryKey: ['admin', 'leads', 'dash'], queryFn: () => admin.leads({ status: 'new' }), enabled: canLeads })
  const first = user?.name.split(' ')[0] ?? ''

  const add = [
    { icon: Newspaper, t: 'Новость', d: 'Расскажите о событии компании', to: '/admin/content/$type', params: { type: 'news' }, search: { new: true } },
    { icon: Boxes, t: 'Товар', d: 'Добавьте позицию в каталог', to: '/admin/products/$id', params: { id: 'new' } },
    { icon: FileText, t: 'Документ', d: 'Загрузите сертификат или руководство', to: '/admin/content/$type', params: { type: 'documents' }, search: { new: true } },
    { icon: Briefcase, t: 'Проект', d: 'Покажите, где работают датчики', to: '/admin/content/$type', params: { type: 'projects' }, search: { new: true } },
  ] as const

  return (
    <>
      <PageHead title={`Здравствуйте, ${first}`} lead="Здесь вы наполняете сайт и обрабатываете заявки. Всё, что вы сохраните, сразу появится на сайте." />

      {canLeads && (
        <section className="mb-8 border border-ink-200 bg-white" aria-labelledby="leads-title">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 id="leads-title" className="text-2xl text-brand-900">Новые заявки</h2>
              {(stats.data?.leads.new ?? 0) > 0 && <Chip tone="warn">{stats.data?.leads.new}</Chip>}
            </div>
            <Link to="/admin/leads" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-900">Все заявки<ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          {fresh.isPending ? <p className="p-5 text-ink-600">Загрузка…</p> : fresh.isError ? <p className="p-5 text-danger">{errorText(fresh.error)}</p> : fresh.data.items.length === 0 ? (
            <p className="p-5 text-[0.9375rem] text-ink-600">Новых заявок нет. Когда клиент отправит форму на сайте, она появится здесь.</p>
          ) : (
            <ul>
              {fresh.data.items.slice(0, 5).map((l) => (
                <li key={l.id} className="border-b border-ink-100 last:border-0">
                  <Link to="/admin/leads" search={{ open: l.id }} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3.5 hover:bg-ink-50">
                    <span className="min-w-40 font-medium text-brand-900">{l.name}{l.company && <span className="font-normal text-ink-500">, {l.company}</span>}</span>
                    <span className="text-ink-600">{leadKindLabels[l.kind] ?? l.kind}</span>
                    <span className="text-ink-600">{l.phone}</span>
                    <span className="ml-auto text-sm text-ink-500">{ago(l.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {canEdit && (
        <section className="mb-8" aria-labelledby="add-title">
          <h2 id="add-title" className="mb-3 text-2xl text-brand-900">Что добавить на сайт</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {add.map((a) => (
              <li key={a.t}>
                <Link to={a.to} params={a.params as never} search={('search' in a ? a.search : undefined) as never} className="group flex h-full flex-col border border-ink-200 bg-white p-5 hover:border-brand-900">
                  <a.icon className="size-6 text-brand-900" aria-hidden />
                  <span className="mt-3 font-display text-xl font-semibold text-brand-900">{a.t}</span>
                  <span className="mt-1 text-[0.9375rem] text-ink-600">{a.d}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.data && (canEdit || canLeads) && (
        <section aria-labelledby="site-title">
          <h2 id="site-title" className="mb-3 text-2xl text-brand-900">Что сейчас на сайте</h2>
          <dl className="grid gap-px border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: 'Товаров в каталоге', v: stats.data.products.published, to: '/admin/products' },
              { l: 'Документов', v: stats.data.documents, to: '/admin/content/documents' },
              { l: 'Проектов', v: stats.data.projects, to: '/admin/content/projects' },
              { l: 'Отзывов', v: stats.data.reviews, to: '/admin/content/reviews' },
            ].map((s) => (
              <div key={s.l} className="bg-white p-5">
                <dd className="font-display text-4xl font-semibold text-brand-900">{s.v}</dd>
                <dt className="mt-1 text-[0.9375rem] text-ink-600">{s.l}</dt>
              </div>
            ))}
          </dl>
          {!canEdit && <EmptyBlock title="Редактирование недоступно" text="Вашей роли доступны только заявки." />}
        </section>
      )}
      <p className="mt-8"><Link to="/" target="_blank" className={buttonClass('outline', 'md')}>Посмотреть сайт</Link></p>
    </>
  )
}
