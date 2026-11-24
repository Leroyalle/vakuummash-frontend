import { useSeo } from '@/lib/seo'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { ApiError } from '@/api/http'
import { authStore } from '@/auth/store'
import { isStaff } from '@/auth/types'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/Section'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  component: Login,
})

function Login() {
  useSeo({ title: 'Вход', noindex: true })
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await authStore.login(email, password)
      // редирект только на внутренние адреса
      if (redirect?.startsWith('/') && !redirect.startsWith('//')) window.location.assign(redirect)
      else if (isStaff(user)) await navigate({ to: '/admin' })
      else { await authStore.logout(); setError('Вход доступен только сотрудникам.') }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось выполнить вход. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Вход для сотрудников"><Breadcrumbs items={[{ label: 'Вход' }]} /></PageHeader>
      <div className="container-page py-10">
        <Card className="mx-auto max-w-md p-6 md:p-8">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="E-mail" htmlFor="login-email"><Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="Пароль" htmlFor="login-password"><Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
            {error && <p role="alert" className="rounded-sm border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy || !email || !password}>{busy ? 'Входим…' : 'Войти'}</Button>
          </form>
        </Card>
      </div>
    </>
  )
}
