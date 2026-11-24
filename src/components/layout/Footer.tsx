import { Link } from '@tanstack/react-router'
import { useCategories } from '@/api/useCategories'
import { Logo } from '@/components/illustrations/Logo'
import { COMPANY } from '@/config'

const tel = (s: string) => `tel:${s.replace(/[^\d+]/g, '')}`

// «сигнал датчика»: ровная линия с импульсом в форме «VM» из логотипа, период 400
const PULSE = 'h150 l25 -30 l30 42 l25 -30 l25 30 l25 -48 l25 36 h95'
const TRACE = `M0 40 ${Array.from({ length: 8 }, () => PULSE).join(' ')}`

/** Линия сигнала по верхнему краю подвала: по ней бежит оранжевый импульс. */
function SignalTrace() {
  return (
    <svg aria-hidden viewBox="0 0 3200 60" preserveAspectRatio="xMinYMid slice" className="block h-14 w-full">
      <path d={TRACE} fill="none" vectorEffect="non-scaling-stroke" className="stroke-white/20 [stroke-width:1.5]" />
      <path d={TRACE} fill="none" vectorEffect="non-scaling-stroke" pathLength={3200} className="signal-pulse stroke-accent-500 [stroke-width:2.5] [stroke-linecap:round]" />
    </svg>
  )
}

export function Footer() {
  const { categories } = useCategories()
  const h = 'mb-3 font-display text-lg font-semibold text-white'
  const l = 'block py-1 text-[0.9375rem] text-brand-100 hover:text-white'
  return (
    <footer className="mt-auto bg-brand-800 pb-14 text-brand-100 md:pb-0">
      <SignalTrace />
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <address className="mt-5 space-y-2 text-[0.9375rem] not-italic">
            <p><a href={tel(COMPANY.phone)} className="font-display text-2xl font-semibold text-white hover:underline">{COMPANY.phone}</a></p>
            <p><a href={`mailto:${COMPANY.email}`} className="hover:text-white">{COMPANY.email}</a></p>
            <p className="max-w-xs">{COMPANY.address}</p>
          </address>
        </div>
        <nav aria-label="Каталог в подвале">
          <p className={h}>Каталог</p>
          {categories.map((c) => <Link key={c.id} to="/catalog/$category" params={{ category: c.id }} className={l}>{c.name}</Link>)}
        </nav>
        <nav aria-label="Информация">
          <p className={h}>Компания</p>
          <Link to="/about" className={l}>О заводе</Link>
          <Link to="/projects" className={l}>Проекты</Link>
          <Link to="/reviews" className={l}>Отзывы</Link>
          <Link to="/press" className={l}>Новости</Link>
          <Link to="/contacts" className={l}>Контакты</Link>
          <Link to="/contacts" hash="dealer" className={l}>Стать дилером</Link>
        </nav>
        <nav aria-label="Поддержка в подвале">
          <p className={h}>Клиентам</p>
          <Link to="/docs" className={l}>Документация</Link>
          <Link to="/delivery" className={l}>Доставка</Link>
          <Link to="/support" hash="faq" className={l}>Частые вопросы</Link>
          <Link to="/support" hash="services" className={l}>Гарантия и сервис</Link>
          <Link to="/support" hash="identify" className={l}>Идентификация продукции</Link>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-5 text-sm">© 2026 {COMPANY.legal}</div>
      </div>
    </footer>
  )
}
