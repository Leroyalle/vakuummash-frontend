import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useModals } from '@/components/forms/ModalsContext'

/** Марки и цифры — с главной vmelectro.ru, блок «Импортозамещение». */
const BRANDS = ['Danfoss', 'Emerson', 'Yokogawa', 'ABB', 'WIKA', 'Honeywell', 'Endress+Hauser', 'Siemens', 'APLISENS', 'PIEZUS', 'Keller', 'Gaesko', 'Ametek', 'Fluke', 'Krohne', 'Watlow', 'Gefran']
const STATS = [
  { v: '2100+', l: 'готовых решений на замену зарубежных КИП' },
  { v: '50–300%', l: 'экономии по сравнению с иностранными поставками' },
  { v: '1570+', l: 'проектов для заводов России и СНГ' },
]

/** Импортозамещение: короткий заголовок, одна мысль в лиде, марки — строкой, цифры — подпись сразу под числом. */
export function ImportSubstitution() {
  const { openPrice } = useModals()
  return (
    <section className="bg-brand-950 text-white">
      <div className="container-page section grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <div>
          <p className="font-display text-sm font-bold tracking-[0.14em] text-accent-500 uppercase">Импортозамещение</p>
          <h2 className="mt-3 text-4xl text-balance text-white md:text-5xl">Заменим импортные датчики</h2>
          <p className="mt-5 max-w-[34rem] text-xl leading-relaxed text-white">Изготовим аналог прибора зарубежной марки — даже если нужна одна штука.</p>

          <p className="mt-8 text-sm font-medium text-brand-100">Заменяем приборы марок</p>
          <p className="mt-2 max-w-[38rem] font-display text-lg leading-relaxed text-white/90">
            {BRANDS.map((b, i) => <span key={b}><span className="whitespace-nowrap">{b}{i < BRANDS.length - 1 && <span aria-hidden className="ml-2 text-accent-500">·</span>}</span>{i < BRANDS.length - 1 && ' '}</span>)}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => openPrice()} className="inline-flex h-12 items-center justify-center gap-2 bg-accent-500 px-6 font-medium text-brand-950 transition-colors hover:bg-accent-400">Подобрать аналог<ArrowRight className="size-5" aria-hidden /></button>
            <Link to="/projects" className="inline-flex h-12 items-center justify-center border border-white/50 px-6 font-medium text-white transition-colors hover:bg-white hover:text-brand-900">Наши проекты</Link>
          </div>
        </div>

        <dl className="self-center border-t border-white/15">
          {STATS.map((s) => (
            <div key={s.v} className="border-b border-white/15 py-6">
              <dd className="font-display text-5xl font-bold leading-none text-white md:text-6xl">{s.v}</dd>
              <dt className="mt-2 text-lg text-brand-100">{s.l}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
