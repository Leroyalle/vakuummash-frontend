import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { admin } from '@/api/admin'
import { useAuth } from '@/auth/store'
import { roleLabels, type Role } from '@/auth/types'
import { Chip, EmptyBlock, PageHead, useToast } from '@/components/admin/kit'
import { errorText, Pager } from '@/components/admin/primitives'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'

export const Route = createFileRoute('/admin/users')({
  validateSearch: z.object({ q: z.string().optional().catch(undefined), page: z.number().int().min(1).optional().catch(undefined) }),
  component: UsersPage,
})

/** Публичных аккаунтов нет: в системе только сотрудники. */
const staffRoles: Role[] = ['admin', 'editor', 'manager']
const roleHelp: Record<string, string> = {
  admin: 'Администратор: всё, включая сотрудников',
  editor: 'Редактор: каталог, документы, новости и другое содержимое сайта',
  manager: 'Менеджер: заявки клиентов',
}
const roleOptions = staffRoles.map((value) => ({ value, label: roleLabels[value] }))

function UsersPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { user: me } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const list = useQuery({ queryKey: ['admin', 'users', search], queryFn: () => admin.users(search), placeholderData: (p) => p, enabled: me?.role === 'admin' })
  const update = useMutation({
    mutationFn: (a: { id: string; patch: Parameters<typeof admin.updateUser>[1] }) => admin.updateUser(a.id, a.patch),
    onSuccess: () => { toast('Изменения сохранены'); void qc.invalidateQueries({ queryKey: ['admin', 'users'] }) },
    onError: (e) => toast(errorText(e), 'error'),
  })
  if (me?.role !== 'admin') return <EmptyBlock title="Нет доступа" text="Список сотрудников доступен только администратору." />

  return (
    <>
      <PageHead title="Сотрудники" lead="Кто может входить в управление сайтом и что ему доступно.">
        <Button onClick={() => setCreating(true)}><Plus className="size-4" aria-hidden />Добавить сотрудника</Button>
      </PageHead>

      <ul className="mb-5 space-y-1 border border-ink-200 bg-white p-4 text-[0.9375rem] text-ink-600">{staffRoles.map((r) => <li key={r}>{roleHelp[r]}</li>)}</ul>

      {list.isPending ? <p className="text-ink-600">Загрузка…</p> : list.isError ? <p className="text-danger">{errorText(list.error)}</p> : (
        <>
          <ul className="border border-ink-200 bg-white">
            {list.data.items.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-ink-100 px-5 py-4 last:border-0">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-display text-lg font-semibold text-brand-900">{u.name}{u.id === me.id && <span className="ml-2 text-sm font-normal text-ink-500">это вы</span>}</p>
                  <p className="text-[0.9375rem] text-ink-600">{u.email}</p>
                </div>
                <div className="w-48"><Select aria-label={`Роль: ${u.name}`} value={u.role} onChange={(role) => update.mutate({ id: u.id, patch: { role: role as Role } })} options={roleOptions.map((o) => ({ ...o, disabled: u.id === me.id && o.value !== u.role }))} /></div>
                <Chip tone={u.isActive ? 'ok' : 'neutral'}>{u.isActive ? 'Работает' : 'Доступ закрыт'}</Chip>
                {u.id !== me.id && <Button variant="outline" size="sm" onClick={() => update.mutate({ id: u.id, patch: { isActive: !u.isActive } })}>{u.isActive ? 'Закрыть доступ' : 'Открыть доступ'}</Button>}
              </li>
            ))}
          </ul>
          <Pager page={list.data.page} perPage={list.data.perPage} total={list.data.total} onPage={(p) => void navigate({ search: { ...search, page: p } })} />
        </>
      )}

      <Modal open={creating} onOpenChange={setCreating} title="Новый сотрудник" description="Он сможет войти на страницу /login со своей почтой и паролем.">
        <CreateUser onDone={() => { setCreating(false); toast('Сотрудник добавлен'); void qc.invalidateQueries({ queryKey: ['admin', 'users'] }) }} />
      </Modal>
    </>
  )
}

function CreateUser({ onDone }: { onDone: () => void }) {
  const toast = useToast()
  const [v, setV] = useState({ name: '', email: '', password: '', role: 'editor' as Role })
  const create = useMutation({ mutationFn: () => admin.createUser(v), onSuccess: onDone, onError: (e) => toast(errorText(e), 'error') })
  return (
    <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="space-y-4">
      <Field label="Имя и фамилия" htmlFor="nu-name"><Input id="nu-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required /></Field>
      <Field label="Электронная почта" htmlFor="nu-email" hint="Нужна для входа"><Input id="nu-email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} required /></Field>
      <Field label="Пароль" htmlFor="nu-pass" hint="Не короче 8 символов. Передайте его сотруднику лично"><Input id="nu-pass" type="password" autoComplete="new-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} required minLength={8} /></Field>
      <Field label="Что ему доступно" htmlFor="nu-role" hint={roleHelp[v.role]}><Select id="nu-role" value={v.role} onChange={(role) => setV({ ...v, role: role as Role })} options={roleOptions} /></Field>
      <Button type="submit" className="w-full" disabled={create.isPending}>Добавить</Button>
    </form>
  )
}
