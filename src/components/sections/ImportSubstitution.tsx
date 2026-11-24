import { Link } from '@tanstack/react-router'
import { useModals } from '@/components/forms/ModalsContext'
import { buttonClass } from '@/components/ui/buttonStyles'
import { BrandMark } from '@/components/illustrations/BrandMark'
import { CountUp } from '@/components/motion/CountUp'

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
    <section className="relative isolate overflow-hidden bg-brand-800 text-white">
      <BrandMark id="import-mark" className="top-1/2 right-[-14rem] hidden h-[150%] -translate-y-1/2 opacity-90 lg:block xl:right-[-6rem]" />
      <div className="container-page section relative grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div>
          <h2 className="text-4xl text-balance text-white md:text-6xl">Заменим импортные датчики</h2>
          <p className="mt-5 max-w-[34rem] text-xl leading-relaxed text-brand-50">Изготовим аналог прибора зарубежной марки — даже если нужна одна штука.</p>

          <p className="mt-8 text-sm font-medium text-brand-100">Заменяем приборы марок</p>
          <p className="mt-2 max-w-[38rem] font-display text-lg leading-relaxed text-white">
            {BRANDS.map((b, i) => <span key={b}><span className="whitespace-nowrap">{b}{i < BRANDS.length - 1 && <span aria-hidden className="ml-2 text-accent-500">·</span>}</span>{i < BRANDS.length - 1 && ' '}</span>)}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => openPrice()} className={buttonClass('primary', 'lg')}>Подобрать аналог</button>
            <Link to="/projects" className={buttonClass('outline', 'lg', 'border-white/70 text-white hover:border-white hover:bg-white hover:text-brand-900')}>Наши проекты</Link>
          </div>
        </div>

        {/* цифры на плашке поверх серпа, чтобы читались */}
        <dl className="self-center border-t-4 border-accent-500 bg-brand-950 px-6 md:px-8">
          {STATS.map((s, i) => (
            <div key={s.v} className={i ? 'border-t border-white/15 py-6' : 'py-6'}>
              <dd className="font-display text-5xl font-bold leading-none text-white md:text-6xl"><CountUp value={s.v} /></dd>
              <dt className="mt-2 text-lg text-brand-100">{s.l}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
