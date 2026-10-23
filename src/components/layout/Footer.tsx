import { Link } from '@tanstack/react-router'
import { Mail, MapPin, Phone } from 'lucide-react'
import { COMPANY } from '@/config'
import { categories } from '@/data'
import { Logo } from '@/components/illustrations/Logo'

export function Footer() {
  const h = 'mb-3 text-sm font-semibold text-white'
  const l = 'block py-1 text-sm text-brand-100 hover:text-white'
  return (
    <footer className="mt-auto bg-brand-900 text-brand-100">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm">Датчики давления и температуры, преобразователи, клапанные блоки, узлы и детали для ремонта и монтажа.</p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-accent-400" aria-hidden /><span>{COMPANY.phone}</span></li>
            <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-accent-400" aria-hidden />{COMPANY.email}</li>
            <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-accent-400" aria-hidden />{COMPANY.address}</li>
          </ul>
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
          <Link to="/contacts" className={l}>Контакты</Link>
          <Link to="/contacts" hash="dealer" className={l}>Стать дилером</Link>
          <Link to="/vacancies" className={l}>Вакансии</Link>
          <Link to="/press" className={l}>Пресс-центр</Link>
        </nav>
        <nav aria-label="Поддержка в подвале">
          <p className={h}>Клиентам</p>
          <Link to="/docs" className={l}>Документация</Link>
          <Link to="/delivery" className={l}>Доставка</Link>
          <Link to="/support" className={l}>Поддержка и FAQ</Link>
          <Link to="/support" hash="services" className={l}>Поверка и ремонт</Link>
          <Link to="/support" hash="identify" className={l}>Идентификация продукции</Link>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-wrap justify-between gap-2 py-5 text-xs">
          <span>© 2026 {COMPANY.legal}. Демонстрационный макет сайта.</span>
          <span>Данные с vmelectro.ru и vakuummash.ru</span>
        </div>
      </div>
    </footer>
  )
}
