import * as Dialog from '@radix-ui/react-dialog';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { t } from '@/lib/motion';
import { ChevronDown, Download, Menu, Phone, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { COMPANY } from '@/config';
import { categories, featuredProducts } from '@/data';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { CategoryIcon } from '@/components/illustrations/CategoryIcon';
import { Logo } from '@/components/illustrations/Logo';
import { useModals } from '@/components/forms/ModalsContext';

const nav = [
  { to: '/docs', label: 'Документация' },
  { to: '/projects', label: 'Проекты' },
  { to: '/reviews', label: 'Отзывы' },
  { to: '/support', label: 'Поддержка' },
  { to: '/about', label: 'О заводе' },
  { to: '/contacts', label: 'Контакты' },
] as const;

export function Header() {
  const { openCallback, openPrice } = useModals();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [lang, setLang] = useState<'RU' | 'EN'>('RU');
  const [query, setQuery] = useState('');
  const wrap = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMega(false);
    setMobile(false);
    setSearch(false);
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (setMega(false), setSearch(false));
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setMega(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void navigate({ to: '/catalog', search: { q: query.trim() || undefined } });
  };
  const active = (to: string) => pathname === to || pathname.startsWith(to + '/');

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-brand-900 text-white transition-shadow duration-300 lg:-top-9',
        scrolled ? 'shadow-lg' : 'shadow-sm',
      )}
      ref={wrap}>
      <div className="hidden border-b border-white/10 text-xs text-brand-100 lg:block">
        <div className="container-page flex h-9 items-center justify-between">
          <span className="flex items-center gap-4">
            <a
              href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`}
              className="inline-flex items-center gap-1.5 font-semibold text-white">
              <Phone className="size-3.5 text-accent-400" aria-hidden />
              {COMPANY.phone}
            </a>
            <span>{COMPANY.address}</span>
          </span>
          <div className="flex items-center gap-5">
            <Link
              to="/docs"
              search={{ type: 'catalog' }}
              className="inline-flex items-center gap-1.5 hover:text-white">
              <Download className="size-3.5" aria-hidden />
              Скачать каталог
            </Link>
            <div
              role="group"
              aria-label="Язык"
              className="flex overflow-hidden rounded-sm border border-white/20">
              {(['RU', 'EN'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={cn(
                    'px-2.5 py-0.5 font-medium',
                    lang === l ? 'bg-white text-brand-900' : 'hover:bg-white/10',
                  )}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-4 xl:gap-6">
        <Link to="/" aria-label={`${COMPANY.name} — на главную`}>
          <Logo light />
        </Link>

        <nav aria-label="Основное" className="hidden flex-1 items-center gap-0.5 lg:flex">
          <div className="relative">
            <button
              type="button"
              aria-expanded={mega}
              aria-controls="mega"
              onClick={() => setMega(v => !v)}
              onMouseEnter={() => setMega(true)}
              className={cn(
                'relative after:absolute after:inset-x-3 after:bottom-3 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent-500 after:transition-transform after:duration-300 hover:after:scale-x-100 flex h-16 items-center gap-1 whitespace-nowrap px-3 text-sm font-medium hover:text-accent-400',
                active('/catalog') && 'text-accent-400 after:scale-x-100',
              )}>
              Каталог{' '}
              <ChevronDown
                className={cn('size-4 transition-transform', mega && 'rotate-180')}
                aria-hidden
              />
            </button>
          </div>
          {nav.map(n => (
            <Link
              key={n.to}
              to={n.to}
              onMouseEnter={() => setMega(false)}
              className={cn(
                'relative after:absolute after:inset-x-3 after:bottom-3 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent-500 after:transition-transform after:duration-300 hover:after:scale-x-100 flex h-16 items-center whitespace-nowrap px-3 text-sm font-medium hover:text-accent-400',
                active(n.to) && 'text-accent-400 after:scale-x-100',
              )}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Поиск по каталогу"
            aria-expanded={search}
            onClick={() => setSearch(v => !v)}
            className="rounded-sm p-2 hover:bg-white/10">
            <Search className="size-5" aria-hidden />
          </button>
          {/* <Button variant="ghost" size="sm" className="hidden text-white hover:bg-white/10 xl:inline-flex" onClick={openCallback}>Заказать звонок</Button> */}
          <Button size="sm" className="hidden md:inline-flex" onClick={() => openPrice()}>
            Запросить цену
          </Button>
          <Dialog.Root open={mobile} onOpenChange={setMobile}>
            <Dialog.Trigger
              className="rounded-sm p-2 hover:bg-white/10 lg:hidden"
              aria-label="Открыть меню">
              <Menu className="size-6" aria-hidden />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[60] bg-brand-950/60 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
              <Dialog.Content
                className="data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out fixed top-0 right-0 z-[61] flex h-dvh w-[min(22rem,90vw)] flex-col overflow-y-auto bg-brand-900 p-5 text-white"
                data-lenis-prevent="">
                <Dialog.Title className="sr-only">Меню</Dialog.Title>
                <Dialog.Description className="sr-only">Навигация по сайту</Dialog.Description>
                <Dialog.Close
                  className="mb-4 ml-auto rounded-sm p-1 hover:bg-white/10"
                  aria-label="Закрыть меню">
                  <X className="size-6" aria-hidden />
                </Dialog.Close>
                <nav aria-label="Мобильное" className="flex flex-col">
                  <Link to="/catalog" className="border-b border-white/10 py-3 font-semibold">
                    Каталог
                  </Link>
                  {categories.map(c => (
                    <Link
                      key={c.id}
                      to="/catalog/$category"
                      params={{ category: c.id }}
                      className="py-2 pl-4 text-sm text-brand-100">
                      {c.name}
                    </Link>
                  ))}
                  {nav.map(n => (
                    <Link
                      key={n.to}
                      to={n.to}
                      className="border-b border-white/10 py-3 font-semibold">
                      {n.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-6 space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setMobile(false);
                      openPrice();
                    }}>
                    Запросить цену
                  </Button>
                  <Button
                    variant="light"
                    className="w-full"
                    onClick={() => {
                      setMobile(false);
                      openCallback();
                    }}>
                    Заказать звонок
                  </Button>
                  <a
                    href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`}
                    className="block text-center font-semibold">
                    {COMPANY.phone}
                  </a>
                  <div role="group" aria-label="Язык" className="flex justify-center gap-2">
                    {(['RU', 'EN'] as const).map(l => (
                      <button
                        key={l}
                        type="button"
                        aria-pressed={lang === l}
                        onClick={() => setLang(l)}
                        className={cn(
                          'rounded-sm border border-white/30 px-3 py-1 text-sm',
                          lang === l && 'bg-white text-brand-900',
                        )}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {search && (
        <form onSubmit={submit} role="search" className="border-t border-white/10 bg-brand-700">
          <div className="container-page flex gap-2 py-3">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по каталогу: серия, название, артикул"
              aria-label="Поиск по каталогу"
              className="h-11 flex-1 rounded-sm bg-white px-4 text-sm text-ink-800 placeholder:text-ink-500"
            />
            <button type="submit" className={buttonClass('primary', 'md')}>
              Найти
            </button>
          </div>
        </form>
      )}

      <AnimatePresence>
        {mega && (
          <motion.div
            id="mega"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: t('base') }}
            exit={{ opacity: 0, y: -4, transition: t('fast') }}
            onMouseLeave={() => setMega(false)}
            className="absolute inset-x-0 top-full hidden border-t border-white/10 bg-white text-ink-800 shadow-xl lg:block">
            <div className="container-page grid grid-cols-[1fr_20rem] gap-10 py-8">
              <div className="grid grid-cols-2 gap-4">
                {categories.map(c => (
                  <Link
                    key={c.id}
                    to="/catalog/$category"
                    params={{ category: c.id }}
                    className="group flex gap-4 rounded-md border border-ink-200 p-4 transition-colors hover:border-accent-500">
                    <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-brand-50 text-brand-700 group-hover:bg-accent-500 group-hover:text-white">
                      <CategoryIcon name={c.icon} className="size-6" />
                    </span>
                    <span>
                      <span className="block font-semibold text-brand-900">{c.name}</span>
                      <span className="mt-0.5 block text-sm text-ink-600">{c.count} позиций</span>
                    </span>
                  </Link>
                ))}
              </div>
              <div>
                <p className="eyebrow mb-3">Популярное</p>
                <ul className="space-y-2">
                  {featuredProducts.map(p => (
                    <li key={p.id}>
                      <Link
                        to="/catalog/$category/$productId"
                        params={{ category: p.category, productId: p.id }}
                        className="flex items-center justify-between text-sm hover:text-accent-700">
                        <span className="line-clamp-2">{p.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/catalog" className={buttonClass('outline', 'sm', 'mt-4')}>
                  Весь каталог
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

