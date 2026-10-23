import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CountUp } from '@/components/motion/CountUp'
import { RevealStagger } from '@/components/motion/Reveal'
import { ArrowRight, Download, FileText } from 'lucide-react'
import { ProductImage } from '@/components/catalog/ProductCard'
import { q } from '@/api/queries'
import { documents, featuredProducts, products as allProducts, projects as allProjects, reviews as allReviews } from '@/data'
import { ProductCard, ProductCardSkeleton } from '@/components/catalog/ProductCard'
import { CategoryIcon } from '@/components/illustrations/CategoryIcon'
import { ConsultBlock, CardsSkeleton, ReviewCard, StaffCard } from '@/components/sections/Common'
import { QuickSelect } from '@/components/sections/QuickSelect'
import { Async } from '@/components/ui/Async'
import { Badge } from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Card } from '@/components/ui/Card'
import { SectionHead } from '@/components/ui/Section'
import { useModals } from '@/components/forms/ModalsContext'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'ВАКУУММАШ-ЭЛЕКТРО — датчики давления и температуры' }] }),
  component: Home,
})

function Home() {
  const { openPrice } = useModals()
  const categories = useQuery(q.categories())
  const industries = useQuery(q.industries())
  const popular = useQuery(q.popular())
  const projects = useQuery(q.projects())
  const reviews = useQuery(q.reviews())
  const staff = useQuery(q.staff())

  return (
    <>
      {/* Hero */}
      <section className="relative bg-brand-900 text-white grid-bg">
        <div className="container-page grid items-center gap-10 pt-12 pb-32 md:pt-16 lg:grid-cols-[1.2fr_1fr] lg:pb-36">
          <RevealStagger>
            <Badge tone="accent" className="bg-accent-500/20 text-accent-400">Производственный комплекс полного цикла, Сарапул</Badge>
            <h1 className="mt-5 text-4xl leading-[1.1] text-white md:text-5xl">Датчики давления и температуры для точных измерений в промышленности</h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">«ВакууммашЭлектро» выполняет полный цикл работ по промышленной автоматизации: от проектной идеи до серийного производства. Датчики давления и температуры, преобразователи, узлы и детали для ремонта и монтажа.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/catalog/$category" params={{ category: 'pressure' }} className={buttonClass('primary', 'lg')}>Подобрать датчик<ArrowRight className="size-4" aria-hidden /></Link>
              <button type="button" onClick={() => openPrice()} className={buttonClass('light', 'lg')}>Запросить цену</button>
              <Link to="/docs" search={{ type: 'catalog' }} className={buttonClass('ghost', 'lg', 'text-white hover:bg-white/10')}><Download className="size-4" aria-hidden />Скачать каталог</Link>
            </div>
          </RevealStagger>
          <div className="hidden lg:block">
            <div className="mx-auto max-w-sm rounded-md bg-white p-4 shadow-2xl">
              <ProductImage p={featuredProducts[0]} className="h-72 w-full" />
              <p className="px-1 pt-2 text-xs text-ink-500">{featuredProducts[0].name}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Быстрый подбор */}
      <section aria-labelledby="qs-title" className="container-page relative z-10 -mt-20 lg:-mt-24">
        <h2 id="qs-title" className="sr-only">Подбор серии</h2>
        <QuickSelect />
      </section>

      {/* Категории */}
      <section className="section container-page">
        <SectionHead eyebrow="Каталог" title="Продукция завода" lead="Датчики давления и температуры, преобразователи, клапанные блоки, узлы и детали для ремонта и монтажа." />
        <Async query={categories} skeleton={<CardsSkeleton n={3} h="h-44" />}>
          {(cats) => (
            <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cats.map((c) => (
                <Link key={c.id} to="/catalog/$category" params={{ category: c.id }} className="group rounded-md border border-ink-200 p-6 transition-colors hover:border-accent-500">
                  <span className="grid size-14 place-items-center rounded-md bg-brand-50 text-brand-700 transition-colors group-hover:bg-accent-500 group-hover:text-white"><CategoryIcon name={c.icon} className="size-8" /></span>
                  <h3 className="mt-5 text-lg">{c.name}</h3>
                  <p className="mt-1.5 text-sm text-ink-600">{c.count} позиций</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 group-hover:text-accent-700">Смотреть<ArrowRight className="size-4" aria-hidden /></span>
                </Link>
              ))}
            </RevealStagger>
          )}
        </Async>
      </section>

      {/* Отрасли */}
      <section className="section bg-ink-50">
        <div className="container-page">
          <SectionHead eyebrow="Отрасли" title="Где работают наши приборы" lead="Отрасли, из которых мы получили отзывы клиентов." />
          <Async query={industries} skeleton={<CardsSkeleton n={6} h="h-32" />}>
            {(list) => (
              <RevealStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((i) => (
                  <Link key={i.name} to="/reviews" search={{ industry: i.name }} className="group rounded-md border border-ink-200 bg-white p-5 transition-colors hover:border-accent-500">
                    <span className="block font-semibold text-brand-900">{i.name}</span>
                    <span className="mt-1 block text-sm text-ink-600">Отзывов: {i.count}</span>
                  </Link>
                ))}
              </RevealStagger>
            )}
          </Async>
        </div>
      </section>

      {/* Цифры */}
      <section className="bg-brand-900 text-white" aria-label="Завод в цифрах">
        <dl className="container-page grid grid-cols-2 gap-y-8 py-12 lg:grid-cols-4">
          {[
            { value: String(allProducts.length), label: 'позиций в каталоге' }, { value: String(allProjects.length), label: 'реализованных проектов' },
            { value: String(allReviews.length), label: 'отзывов клиентов' }, { value: String(documents.length), label: 'сертификатов и документов' },
          ].map((s) => (
            <div key={s.label} className="px-2 text-center lg:border-l lg:border-white/10 lg:first:border-0">
              <dt className="order-2 mt-1 text-sm text-brand-100">{s.label}</dt>
              <dd className="font-mono text-4xl font-medium text-accent-400 md:text-5xl"><CountUp value={s.value} /></dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Популярные */}
      <section className="section container-page">
        <SectionHead eyebrow="Хиты" title="Популярные товары" action={<Link to="/catalog" className={buttonClass('outline', 'sm')}>Весь каталог</Link>} />
        <Async query={popular} skeleton={<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}</div>}>
          {(list) => <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</RevealStagger>}
        </Async>
      </section>

      {/* Проекты */}
      <section className="section bg-ink-50">
        <div className="container-page">
          <SectionHead eyebrow="Опыт" title="Реализованные проекты" action={<Link to="/projects" className={buttonClass('outline', 'sm')}>Все проекты</Link>} />
          <Async query={projects} skeleton={<CardsSkeleton />} isEmpty={(d) => d.length === 0}>
            {(list) => (
              <RevealStagger className="grid gap-5 md:grid-cols-3">
                {list.slice(0, 3).map((p) => (
                  <Link key={p.slug} to="/projects/$slug" params={{ slug: p.slug }} className="group overflow-hidden rounded-md border border-ink-200 bg-white transition-shadow hover:shadow-md">
                    {p.images[0] && <img src={p.images[0]} alt="" loading="lazy" className="h-44 w-full object-cover" />}
                    <div className="p-5">
                      {p.importSubstitution && <Badge tone="accent">По импортозамещению</Badge>}
                      <h3 className="mt-2 text-lg group-hover:text-accent-700">{p.title}</h3>
                      {p.region && <p className="mt-1 text-sm text-ink-500">{p.region}</p>}
                    </div>
                  </Link>
                ))}
              </RevealStagger>
            )}
          </Async>
        </div>
      </section>

      {/* Отзывы */}
      <section className="section container-page">
        <SectionHead eyebrow="Отзывы" title="Что говорят клиенты" action={<Link to="/reviews" className={buttonClass('outline', 'sm')}>Все отзывы</Link>} />
        <Async query={reviews} skeleton={<CardsSkeleton />} isEmpty={(d) => d.length === 0}>
          {(list) => <RevealStagger className="grid gap-5 md:grid-cols-3">{list.slice(0, 3).map((r) => <ReviewCard key={r.id} r={r} />)}</RevealStagger>}
        </Async>
      </section>

      {/* Специалисты */}
      <section className="section bg-ink-50">
        <div className="container-page">
          <SectionHead eyebrow="Эксперты" title="Вопросы к специалистам" lead="Свяжитесь с отделом продаж и инженерами — подскажем по подбору и срокам." />
          <Async query={staff} skeleton={<CardsSkeleton />}>
            {(list) => <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((s) => <StaffCard key={s.id} s={s} />)}</RevealStagger>}
          </Async>
        </div>
      </section>

      <section className="container-page section">
        <Card className="flex flex-col items-start justify-between gap-5 p-6 md:flex-row md:items-center md:p-8">
          <div className="flex items-start gap-4"><FileText className="mt-1 size-8 shrink-0 text-accent-600" aria-hidden /><div><h2 className="text-xl">Не нашли нужную модификацию?</h2><p className="mt-1 text-sm text-ink-600">Заполните опросный лист — изготовим датчик под ваши параметры.</p></div></div>
          <Link to="/support" className={buttonClass('primary', 'lg')}>Отправить опросный лист</Link>
        </Card>
      </section>

      <ConsultBlock />
    </>
  )
}
