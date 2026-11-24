import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useBlocker } from '@tanstack/react-router'
import { Mail, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { admin, type Lead } from '@/api/admin'
import { useAuth } from '@/auth/store'
import { Chip, EmptyBlock, PageHead, useConfirm, useToast } from '@/components/admin/kit'
import { leadKindLabels, leadStatusLabels } from '@/components/admin/labels'
import { errorText, Pager } from '@/components/admin/primitives'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/admin/leads')({
  validateSearch: z.object({
    status: z.string().optional().catch(undefined),
    q: z.string().optional().catch(undefined),
    page: z.number().int().min(1).optional().catch(undefined),
    open: z.string().optional().catch(undefined),
  }),
  component: Leads,
})

const tone = { new: 'warn', in_progress: 'brand', done: 'ok', rejected: 'neutral' } as const
const TABS = [
  { id: 'new', label: 'Новые' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'done', label: 'Выполнены' },
  { id: 'rejected', label: 'Отклонены' },
  { id: 'mine', label: 'Мои' },
  { id: 'all', label: 'Все' },
] as const

const when = (iso: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

function Leads() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const status = search.status ?? 'new'
  const { user } = useAuth()
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: admin.stats })
  const list = useQuery({ queryKey: ['admin', 'leads', status, search.q, search.page], queryFn: () => admin.leads({ status: status === 'all' || status === 'mine' ? undefined : status, assigneeId: status === 'mine' ? user?.id : undefined, q: search.q, page: search.page }), placeholderData: (p) => p })
  const opened = useQuery({ queryKey: ['admin', 'lead', search.open], queryFn: () => admin.lead(search.open!), enabled: !!search.open })
  const counts = stats.data?.leads
  const setS = (patch: Partial<typeof search>) => void navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }) })
  const confirm = useConfirm()
  // несохранённые правки в открытой заявке (статус, ответственный, заметка)
  const [dirty, setDirty] = useState(false)
  const ask = () => confirm({ title: 'Закрыть заявку без сохранения?', text: 'Изменения статуса, ответственного и заметки не сохранятся.', confirmLabel: 'Закрыть без сохранения' })
  const close = () => { setDirty(false); void navigate({ search: (prev) => ({ ...prev, open: undefined }) }) }
  const requestClose = async () => { if (!dirty || (await ask())) close() }
  // уход в другой раздел админки или закрытие вкладки при открытой изменённой заявке
  useBlocker({
    shouldBlockFn: async ({ current, next }) => (dirty && next.pathname !== current.pathname ? !(await ask()) : false),
    enableBeforeUnload: () => dirty,
  })

  return (
    <>
      <PageHead title="Заявки" lead="Обращения клиентов с форм сайта. Откройте заявку, позвоните клиенту и отметьте результат: так ничего не потеряется." />

      <div role="tablist" aria-label="Статус заявок" className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = t.id === 'all' || t.id === 'mine' ? undefined : counts?.[t.id as keyof typeof counts]
          const on = status === t.id
          return (
            <button key={t.id} role="tab" type="button" aria-selected={on} onClick={() => setS({ status: t.id === 'new' ? undefined : t.id })}
              className={cn('inline-flex h-10 items-center gap-2 border px-4 text-[0.9375rem] font-medium', on ? 'border-brand-900 bg-brand-900 text-white' : 'border-ink-300 bg-white text-ink-800 hover:border-brand-900')}>
              {t.label}{n !== undefined && <span className={cn('text-sm', on ? 'text-brand-100' : 'text-ink-500')}>{n}</span>}
            </button>
          )
        })}
        <div className="ml-auto w-full sm:w-72"><Input aria-label="Найти заявку" placeholder="Имя, телефон или компания" defaultValue={search.q} onKeyDown={(e) => e.key === 'Enter' && setS({ q: e.currentTarget.value || undefined })} onBlur={(e) => e.currentTarget.value !== (search.q ?? '') && setS({ q: e.currentTarget.value || undefined })} /></div>
      </div>

      {list.isPending ? <p className="text-ink-600">Загрузка…</p> : list.isError ? <p className="text-danger">{errorText(list.error)}</p> : list.data.items.length === 0 ? (
        <EmptyBlock title={status === 'new' ? 'Новых заявок нет' : status === 'mine' ? 'У вас нет заявок' : 'Заявок не найдено'} text={status === 'new' ? 'Когда клиент отправит форму на сайте, заявка появится здесь.' : status === 'mine' ? 'Откройте новую заявку и нажмите «Взять себе», тогда она появится здесь.' : 'Попробуйте другой статус или поисковый запрос.'} />
      ) : (
        <>
          <ul className="border border-ink-200 bg-white">
            {list.data.items.map((l) => (
              <li key={l.id} className="border-b border-ink-100 last:border-0">
                <button type="button" onClick={() => void navigate({ search: (prev) => ({ ...prev, open: l.id }) })} className="grid w-full gap-x-6 gap-y-1 px-5 py-4 text-left hover:bg-ink-50 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
                  <span><span className="block font-display text-lg font-semibold text-brand-900">{l.name}</span>{l.company && <span className="block text-sm text-ink-500">{l.company}</span>}</span>
                  <span className="text-[0.9375rem] text-ink-800">{leadKindLabels[l.kind] ?? l.kind}{l.extra['Товар'] && <span className="block text-sm text-ink-500">{l.extra['Товар']}</span>}</span>
                  <span className="text-[0.9375rem] text-ink-600">{l.phone}<span className="block text-sm text-ink-500">{when(l.createdAt)}</span></span>
                  <span className="md:justify-self-end md:text-right"><Chip tone={tone[l.status as keyof typeof tone] ?? 'neutral'}>{leadStatusLabels[l.status] ?? l.status}</Chip><span className="mt-1 block text-sm text-ink-500">{l.assigneeId ? (l.assigneeId === user?.id ? 'Ведёте вы' : `Ведёт: ${l.assigneeName ?? 'сотрудник'}`) : 'Никто не взял'}</span></span>
                </button>
              </li>
            ))}
          </ul>
          <Pager page={list.data.page} perPage={list.data.perPage} total={list.data.total} onPage={(p) => void navigate({ search: (prev) => ({ ...prev, page: p }) })} />
        </>
      )}

      <Modal open={!!search.open} onOpenChange={(o) => { if (!o) void requestClose() }} title={opened.data ? opened.data.name : 'Заявка'} description={opened.data ? `${leadKindLabels[opened.data.kind] ?? opened.data.kind}, получена ${when(opened.data.createdAt)}` : undefined} size="xl">
        {opened.isPending ? <p className="text-ink-600">Загрузка…</p> : opened.isError ? <p className="text-danger">{errorText(opened.error)}</p> : (
          <LeadDetails key={opened.data.id} lead={opened.data} onSaved={close} onCancel={() => void requestClose()} onDirty={setDirty} />
        )}
      </Modal>
    </>
  )
}

function LeadDetails({ lead, onSaved, onCancel, onDirty }: { lead: Lead; onSaved: () => void; onCancel: () => void; onDirty: (dirty: boolean) => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const { user } = useAuth()
  const [status, setStatus] = useState(lead.status)
  const [note, setNote] = useState(lead.note ?? '')
  const [assignee, setAssignee] = useState<string | null>(lead.assigneeId)
  const dirty = status !== lead.status || note !== (lead.note ?? '') || assignee !== lead.assigneeId
  useEffect(() => onDirty(dirty), [dirty, onDirty])
  const save = useMutation({
    mutationFn: () => admin.updateLead(lead.id, { status, note: note || null, assigneeId: assignee }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin'] }); toast('Заявка сохранена'); onSaved() },
    onError: (e) => toast(errorText(e), 'error'),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <a href={`tel:${lead.phone}`} className="inline-flex h-11 items-center gap-2 bg-accent-500 px-5 font-medium text-brand-950 hover:bg-accent-400"><Phone className="size-4" aria-hidden />Позвонить {lead.phone}</a>
        {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex h-11 items-center gap-2 border border-brand-900 px-5 font-medium text-brand-900 hover:bg-brand-900 hover:text-white"><Mail className="size-4" aria-hidden />Написать {lead.email}</a>}
      </div>

      {(lead.company || lead.comment || Object.keys(lead.extra).length > 0) && (
        <dl className="border border-ink-200 text-[0.9375rem]">
          {lead.company && <div className="grid gap-1 border-b border-ink-100 px-4 py-2.5 sm:grid-cols-[10rem_1fr]"><dt className="text-ink-500">Компания</dt><dd>{lead.company}</dd></div>}
          {lead.comment && <div className="grid gap-1 border-b border-ink-100 px-4 py-2.5 sm:grid-cols-[10rem_1fr]"><dt className="text-ink-500">{lead.kind === 'selection' ? 'Что нужно' : 'Сообщение'}</dt><dd className="whitespace-pre-wrap">{lead.comment}</dd></div>}
          {Object.entries(lead.extra).map(([k, v]) => <div key={k} className="grid gap-1 border-b border-ink-100 px-4 py-2.5 last:border-0 sm:grid-cols-[10rem_1fr]"><dt className="text-ink-500">{k}</dt><dd className={k === 'Артикул' ? 'font-mono' : ''}>{v}</dd></div>)}
        </dl>
      )}

      <div>
        <p className="mb-2 text-[0.9375rem] font-medium text-brand-900">Что с заявкой</p>
        <div role="radiogroup" aria-label="Статус заявки" className="flex flex-wrap gap-2">
          {Object.entries(leadStatusLabels).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={status === v} onClick={() => setStatus(v)} className={cn('h-10 border px-4 text-[0.9375rem]', status === v ? 'border-brand-900 bg-brand-900 text-white' : 'border-ink-300 bg-white hover:border-brand-900')}>{l}</button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-ink-200 bg-ink-50 px-4 py-3">
          <span className="text-[0.9375rem] text-ink-600">Ответственный:</span>
          <span className="font-medium text-brand-900">{assignee ? (assignee === user?.id ? `вы (${user?.name})` : lead.assigneeId === assignee ? lead.assigneeName ?? 'сотрудник' : 'сотрудник') : 'никто не взял'}</span>
          {assignee !== user?.id
            ? <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setAssignee(user!.id); if (status === 'new') setStatus('in_progress') }}>{assignee ? 'Забрать себе' : 'Взять себе'}</Button>
            : <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setAssignee(null)}>Отказаться</Button>}
        </div>
        <p className="mt-1.5 text-sm text-ink-500">Ответственный видит заявку во вкладке «Мои». Изменение вступит в силу после «Сохранить».</p>
      </div>

      <Field label="Заметка для коллег" htmlFor="lead-note" hint="Видна только сотрудникам: о чём договорились, что отправили"><Textarea id="lead-note" value={note} onChange={(e) => setNote(e.target.value)} /></Field>

      <div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Закрыть</Button><Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Сохраняем…' : 'Сохранить'}</Button></div>
    </div>
  )
}
