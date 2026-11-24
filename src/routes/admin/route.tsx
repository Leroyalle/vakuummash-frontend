import * as Dialog from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { BarChart3, Boxes, Briefcase, ExternalLink, FileText, Files, FolderTree, HelpCircle, Inbox, LogOut, Menu, Newspaper, Quote, UserPlus, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { admin } from '@/api/admin'
import { authStore, useAuth } from '@/auth/store'
import { hasRole, isStaff, roleLabels, type Role } from '@/auth/types'
import { AdminProviders } from '@/components/admin/kit'
import { Logo } from '@/components/illustrations/Logo'
import { cn } from '@/lib/cn'
import { useSeo } from '@/lib/seo'

export const Route = createFileRoute('/admin')({ component: AdminLayout })

type NavItem = { to: string; params?: Record<string, string>; label: string; icon: typeof BarChart3; roles: Role[]; badge?: 'newLeads' }
type NavGroup = { title: string | null; items: NavItem[] }

const groups: NavGroup[] = [
  {
    title: null,
    items: [
      { to: '/admin', label: 'Главная', icon: BarChart3, roles: ['manager', 'editor'] },
      { to: '/admin/leads', label: 'Заявки', icon: Inbox, roles: ['manager'], badge: 'newLeads' },
    ],
  },
  {
    title: 'Каталог',
    items: [
      { to: '/admin/products', label: 'Товары', icon: Boxes, roles: ['editor'] },
      { to: '/admin/categories', label: 'Разделы каталога', icon: FolderTree, roles: ['editor'] },
    ],
  },
  {
    title: 'Содержимое сайта',
    items: [
      { to: '/admin/content/$type', params: { type: 'news' }, label: 'Новости', icon: Newspaper, roles: ['editor'] },
      { to: '/admin/content/$type', params: { type: 'documents' }, label: 'Документы', icon: FileText, roles: ['editor'] },
      { to: '/admin/content/$type', params: { type: 'projects' }, label: 'Проекты', icon: Briefcase, roles: ['editor'] },
      { to: '/admin/content/$type', params: { type: 'reviews' }, label: 'Отзывы', icon: Quote, roles: ['editor'] },
      { to: '/admin/content/$type', params: { type: 'vacancies' }, label: 'Вакансии', icon: UserPlus, roles: ['editor'] },
      { to: '/admin/content/$type', params: { type: 'faq' }, label: 'Вопросы и ответы', icon: HelpCircle, roles: ['editor'] },
      { to: '/admin/content/$type', params: { type: 'pages' }, label: 'Страницы сайта', icon: Files, roles: ['editor'] },
    ],
  },
  { title: 'Настройки', items: [{ to: '/admin/users', label: 'Сотрудники', icon: Users, roles: ['admin'] }] },
]

function AdminLayout() {
  useSeo({ title: 'Управление сайтом', noindex: true })
  const { user, ready } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [menu, setMenu] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMenu(false)
  }
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: admin.stats, enabled: hasRole(user, 'manager', 'editor'), refetchInterval: 60_000 })

  useEffect(() => {
    if (ready && !user) void navigate({ to: '/login', search: { redirect: window.location.pathname } })
  }, [ready, user, navigate])

  if (!ready || !user) return <div className="grid min-h-dvh place-items-center text-ink-600">Загрузка…</div>
  if (!isStaff(user)) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div><h1 className="text-3xl">Нет доступа</h1><p className="mt-2 text-ink-600">Управление сайтом доступно только сотрудникам.</p><Link to="/" className="mt-4 inline-block font-medium text-brand-700 underline">Вернуться на сайт</Link></div>
      </div>
    )
  }

  const newLeads = stats.data?.leads.new ?? 0
  const nav = (
    <>
      <nav aria-label="Разделы управления" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((g) => {
          const items = g.items.filter((n) => hasRole(user, ...n.roles))
          if (!items.length) return null
          return (
            <div key={g.title ?? 'main'}>
              {g.title && <p className="mb-1.5 px-3 text-sm text-brand-100/80">{g.title}</p>}
              <ul>
                {items.map((n) => (
                  <li key={n.label}>
                    <Link to={n.to} params={n.params as never} activeOptions={{ exact: n.to === '/admin' }}
                      className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-[0.9375rem] text-brand-100 hover:bg-white/10 hover:text-white"
                      activeProps={{ className: cn('bg-white text-brand-900 hover:bg-white hover:text-brand-900') }}>
                      <n.icon className="size-[18px] shrink-0" aria-hidden />
                      <span className="flex-1">{n.label}</span>
                      {n.badge === 'newLeads' && newLeads > 0 && <span className="rounded-sm bg-accent-500 px-1.5 text-sm font-semibold text-brand-950">{newLeads}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="px-3 text-[0.9375rem] font-medium text-white">{user.name}</p>
        <p className="px-3 text-sm text-brand-100/80">{roleLabels[user.role]}</p>
        <div className="mt-2 space-y-0.5">
          <Link to="/" target="_blank" className="flex items-center gap-3 rounded-sm px-3 py-2 text-[0.9375rem] text-brand-100 hover:bg-white/10 hover:text-white"><ExternalLink className="size-[18px]" aria-hidden />Открыть сайт</Link>
          <button type="button" onClick={() => void authStore.logout().then(() => navigate({ to: '/login' }))} className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-[0.9375rem] text-brand-100 hover:bg-white/10 hover:text-white"><LogOut className="size-[18px]" aria-hidden />Выйти</button>
        </div>
      </div>
    </>
  )

  return (
    <AdminProviders>
      <div className="min-h-dvh bg-ink-50 lg:grid lg:grid-cols-[17rem_1fr]">
        <aside className="hidden bg-brand-900 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
          <Link to="/admin" aria-label="Управление сайтом — главная" className="block bg-white px-4 py-4"><Logo compact /></Link>
          {nav}
        </aside>

        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-200 bg-white px-4 lg:hidden">
          <span className="block w-44"><Logo compact /></span>
          <Dialog.Root open={menu} onOpenChange={setMenu}>
            <Dialog.Trigger className="relative grid size-10 place-items-center rounded-sm hover:bg-ink-100" aria-label="Открыть меню">
              <Menu className="size-6" aria-hidden />
              {newLeads > 0 && <span className="absolute top-1 right-1 size-2.5 rounded-full bg-accent-500" aria-hidden />}
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[60] bg-brand-950/60" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-[61] flex w-[min(20rem,90vw)] flex-col bg-brand-900" data-lenis-prevent="">
                <Dialog.Title className="sr-only">Меню управления</Dialog.Title>
                <Dialog.Description className="sr-only">Разделы управления сайтом</Dialog.Description>
                <div className="flex items-center justify-between bg-white px-4 py-3"><span className="block w-48"><Logo compact /></span><Dialog.Close className="text-brand-900" aria-label="Закрыть меню"><X className="size-6" aria-hidden /></Dialog.Close></div>
                {nav}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <main id="main" className="min-w-0 p-4 md:p-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
      </div>
    </AdminProviders>
  )
}
