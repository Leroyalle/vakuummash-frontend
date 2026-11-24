import * as Dialog from '@radix-ui/react-dialog'
import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Menu, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useCategories } from '@/api/useCategories'
import { useModals } from '@/components/forms/ModalsContext'
import { Logo } from '@/components/illustrations/Logo'
import { CatalogMenu } from './CatalogMenu'
import { SearchBox } from './SearchBox'
import { Button } from '@/components/ui/Button'
import { COMPANY } from '@/config'
import { cn } from '@/lib/cn'

const nav = [
  { to: '/docs', label: 'Документация' },
  { to: '/projects', label: 'Проекты' },
  { to: '/press', label: 'Новости' },
  { to: '/support', label: 'Поддержка' },
  { to: '/about', label: 'О заводе' },
  { to: '/contacts', label: 'Контакты' },
] as const

const tel = (s: string) => `tel:${s.replace(/[^\d+]/g, '')}`

export function Header() {
  const { openCallback, openPrice } = useModals()
  const { categories } = useCategories()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [mega, setMega] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const wrap = useRef<HTMLElement>(null)

  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMega(false)
    setMobile(false)
    setSearchOpen(false)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (setMega(false), setSearchOpen(false))
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setMega(false)
      if (!(e.target as Element).closest?.('[data-search]')) setSearchOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [])

  const active = (to: string) => pathname === to || pathname.startsWith(`${to}/`)
  const item = 'relative flex h-[5.75rem] items-center whitespace-nowrap px-2.5 font-display text-base font-medium text-brand-900 hover:text-brand-700 min-[1600px]:px-3.5'
  const bar = 'after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] after:bg-accent-500 min-[1600px]:after:inset-x-3.5'

  return (
    <header ref={wrap} className="sticky top-0 z-50 border-b-[3px] border-brand-500 bg-white">
      <div className="hidden bg-brand-500 text-[0.8125rem] text-brand-50 lg:block">
        <div className="container-page flex h-9 items-center justify-between">
          <div className="flex items-center gap-6">
            <a href={tel(COMPANY.phone)} className="font-medium text-white hover:underline">{COMPANY.phone}</a>
            <a href={`mailto:${COMPANY.email}`} className="hover:text-white">{COMPANY.email}</a>
            <span className="hidden xl:inline">Сарапул, Удмуртская Республика</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/docs" search={{ type: 'catalog' }} className="hover:text-white">Каталог в PDF</Link>
            <button type="button" onClick={openCallback} className="hover:text-white">Заказать звонок</button>
          </div>
        </div>
      </div>

      <div className="container-page flex h-[5.75rem] items-center gap-6">
        <Link to="/" aria-label={`${COMPANY.name} — на главную`} className="shrink-0"><Logo /></Link>

        <nav aria-label="Основное" className="hidden min-w-0 items-center min-[1440px]:flex">
          {/* «Каталог» ведёт в каталог; разделы раскрываются наведением или стрелкой */}
          <div className="flex items-center" onMouseEnter={() => { setMega(true); setSearchOpen(false) }}>
            <Link to="/catalog" className={cn(item, 'pr-1 min-[1600px]:pr-1', active('/catalog') && bar, active('/catalog') && 'after:right-1 min-[1600px]:after:right-1')}>Каталог</Link>
            <button
              type="button"
              aria-label={mega ? 'Скрыть разделы каталога' : 'Показать разделы каталога'}
              aria-expanded={mega}
              aria-controls="mega"
              onClick={() => setMega((v) => !v)}
              className="grid size-8 place-items-center rounded-sm text-brand-900 hover:bg-ink-100"
            >
              <ChevronDown className={cn('size-4 transition-transform duration-200', mega && 'rotate-180')} aria-hidden />
            </button>
          </div>
          {nav.map((n) => (
            <Link key={n.to} to={n.to} onMouseEnter={() => setMega(false)} className={cn(item, active(n.to) && bar)}>{n.label}</Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button type="button" data-search="" aria-label="Поиск по каталогу" aria-expanded={searchOpen} onClick={() => { setSearchOpen((v) => !v); setMega(false) }} className="grid size-10 place-items-center rounded-sm hover:bg-ink-100">
            {searchOpen ? <X className="size-5" aria-hidden /> : <Search className="size-5" aria-hidden />}
          </button>
          <Button size="sm" className="hidden md:inline-flex" onClick={() => openPrice()}>Запросить цену</Button>
          <Dialog.Root open={mobile} onOpenChange={setMobile}>
            <Dialog.Trigger className="grid size-10 place-items-center rounded-sm hover:bg-ink-100 min-[1440px]:hidden" aria-label="Открыть меню">
              <Menu className="size-6" aria-hidden />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-60 bg-brand-950/60 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
              <Dialog.Content className="data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out fixed top-0 right-0 z-61 flex h-dvh w-[min(22rem,92vw)] flex-col overflow-y-auto bg-white p-5 text-brand-900" data-lenis-prevent="">
                <Dialog.Title className="sr-only">Меню</Dialog.Title>
                <Dialog.Description className="sr-only">Навигация по сайту</Dialog.Description>
                <Dialog.Close className="mb-3 ml-auto grid size-9 place-items-center rounded-sm hover:bg-ink-100" aria-label="Закрыть меню"><X className="size-6" aria-hidden /></Dialog.Close>
                <SearchBox onDone={() => setMobile(false)} />
                <nav aria-label="Мобильное" className="mt-4 flex flex-col">
                  <Link to="/catalog" className="border-b border-ink-200 py-3 font-display text-lg font-semibold">Каталог</Link>
                  {categories.map((c) => (
                    <Link key={c.id} to="/catalog/$category" params={{ category: c.id }} className="py-2 pl-4 text-[0.9375rem] text-ink-600">{c.name}</Link>
                  ))}
                  {nav.map((n) => (
                    <Link key={n.to} to={n.to} className="border-b border-ink-200 py-3 font-display text-lg font-semibold">{n.label}</Link>
                  ))}
                </nav>
                <div className="mt-6 space-y-3">
                  <Button className="w-full" onClick={() => { setMobile(false); openPrice() }}>Запросить цену</Button>
                  <Button variant="outline" className="w-full" onClick={() => { setMobile(false); openCallback() }}>Заказать звонок</Button>
                  <a href={tel(COMPANY.phone)} className="block pt-1 text-center font-semibold">{COMPANY.phone}</a>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {searchOpen && (
        <div data-search="" className="animate-pop-in absolute inset-x-0 top-full z-10 border-t border-ink-200 border-b-4 border-b-brand-500 bg-white">
          <div className="container-page py-6"><SearchBox variant="panel" autoFocus onDone={() => setSearchOpen(false)} /></div>
        </div>
      )}

      {mega && (
        <div className="hidden min-[1440px]:block" onMouseLeave={() => setMega(false)}>
          <CatalogMenu onClose={() => setMega(false)} />
        </div>
      )}
    </header>
  )
}
