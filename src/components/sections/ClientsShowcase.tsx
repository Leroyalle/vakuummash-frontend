import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { MigratedProject as Project } from '@/data/schema'

const ending = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many

/** Ряд логотипов, бегущий по кругу: список удвоен, анимация сдвигает ровно на половину. */
function Row({ list, reverse }: { list: Project[]; reverse?: boolean }) {
  return (
    <div className="marquee group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <ul className={reverse ? 'marquee-track marquee-reverse' : 'marquee-track'}>
        {[...list, ...list].map((p, i) => (
          <li key={`${p.slug}-${i}`} aria-hidden={i >= list.length || undefined}>
            <Link to="/projects/$slug" params={{ slug: p.slug }} tabIndex={i >= list.length ? -1 : undefined} title={p.title}
              className="grid h-24 w-48 place-items-center bg-white px-5 transition-transform hover:-translate-y-1 sm:h-28 sm:w-56">
              {p.images[0] ? <img src={p.images[0]} alt={p.title} className="max-h-16 max-w-full object-contain" /> : <span className="text-center font-display font-bold text-brand-900">{p.title}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** «Где работают наши датчики»: крупные цифры из данных проектов и бегущая стена логотипов заказчиков. */
export function ClientsShowcase({ projects }: { projects: Project[] }) {
  const n = projects.length
  const imports = projects.filter((p) => p.importSubstitution).length
  const half = Math.ceil(n / 2)
  return (
    <section className="relative overflow-hidden bg-brand-950 text-white">
      <div className="container-page section">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <h2 className="text-4xl text-white md:text-5xl">Где работают наши датчики</h2>
            <p className="mt-4 max-w-[34rem] text-xl leading-relaxed text-white/90">Нефтепереработка, химия, энергетика, машиностроение. Поставляем от отдельных позиций до замены целых линеек импортных приборов.</p>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-white/15">
            <div className="bg-brand-950 py-2 pr-6">
              <dd className="font-display text-6xl font-bold leading-none text-white md:text-7xl">{n}</dd>
              <dt className="mt-2 text-lg text-brand-100">{ending(n, 'предприятие', 'предприятия', 'предприятий')} в портфолио проектов</dt>
            </div>
            <div className="bg-brand-950 py-2 pl-6">
              <dd className="font-display text-6xl font-bold leading-none text-accent-500 md:text-7xl">{imports}</dd>
              <dt className="mt-2 text-lg text-brand-100">из них — замена импортного оборудования</dt>
            </div>
          </dl>
        </div>
      </div>
      <div className="space-y-4 pb-4">
        <Row list={projects.slice(0, half)} />
        <Row list={projects.slice(half).length ? projects.slice(half) : projects} reverse />
      </div>
      <div className="container-page pt-8 pb-14 md:pb-20">
        <Link to="/projects" className="inline-flex items-center gap-2 font-display text-lg font-bold text-white hover:text-accent-500">
          Смотреть все проекты<ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
