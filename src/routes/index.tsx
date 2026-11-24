import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { q } from '@/api/queries'
import { HeroSlider } from '@/components/sections/HeroSlider'
import { BlueprintBg } from '@/components/illustrations/BlueprintBg'
import { LeadForm } from '@/components/forms/LeadForm'
import { useModals } from '@/components/forms/ModalsContext'
import { ClientsShowcase } from '@/components/sections/ClientsShowcase'
import { ImportSubstitution } from '@/components/sections/ImportSubstitution'
import { CardsSkeleton } from '@/components/sections/Common'
import { QuickSelect } from '@/components/sections/QuickSelect'
import { Async } from '@/components/ui/Async'
import { buttonClass } from '@/components/ui/buttonStyles'
import { SectionHead } from '@/components/ui/Section'
import { COMPANY } from '@/config'

export const Route = createFileRoute('/')({ component: Home })

/** 1 позиция, 2–4 позиции, 5+ позиций */
const positions = (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'позиция' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'позиции' : 'позиций'}`

/** Путь закупщика: только то, что сайт и завод действительно делают. */
const STEPS = [
  { t: 'Выберите серию', d: 'В каталоге или в подборе на главной. Не нашли — напишите задачу, подберём сами.' },
  { t: 'Соберите модификацию', d: 'Конфигуратор сам составит обозначение для заказа и не даст выбрать несовместимое.' },
  { t: 'Отправьте запрос', d: 'Пришлём коммерческое предложение на e-mail. Цена зависит от модификации и количества.' },
  { t: 'Изготовление и доставка', d: 'Делаем от одной штуки. Доставку согласуем и привезём «до дверей».' },
]

const more = 'font-medium text-brand-700 underline underline-offset-4 hover:text-brand-900'

/** Цифры — из раздела «О заводе», сертификата СМК и главной vmelectro.ru; тексты — оттуда же. */
const FIGURES = [
  { v: 'от 1 шт.', l: 'минимальная партия' },
  { v: '0,075%', l: 'точность датчиков давления VMP' },
  { v: '5 лет', l: 'межповерочный интервал' },
  { v: '12+ лет', l: 'срок службы изделий' },
  { v: '7 дней', l: 'на замену брака (рабочих)' },
  { v: 'ISO 9001', l: 'система качества по ГОСТ Р ИСО 9001-2015' },
]
const REASONS = [
  { t: 'Собственное производство', d: 'Своя производственная и конструкторская база, поэтому сроки не сдвигаются.' },
  { t: 'Спецзаказы и чертежи', d: 'Если типовое решение не подходит, разработаем и изготовим прибор под задачу.' },
  { t: 'Монтаж и поддержка', d: 'Смонтируем, наладим, поверим и обучим персонал.' },
]

/** Текст отзыва без приветствия и тегов — для цитаты на главной. */
const quote = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/^\s*(Уважаем[^.!,]*[.!,]|Здравствуйте[.!,]?)\s*/i, '').trim()
const dayMonth = (iso: string) => {
  const d = new Date(iso)
  return { day: String(d.getDate()).padStart(2, '0'), rest: d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }).replace(' г.', '') }
}

function Home() {
  const { openPrice } = useModals()
  const categories = useQuery(q.categories())
  const popular = useQuery(q.popular())
  const catalog = useQuery(q.products({ perPage: 60 }))
  // слайды: сначала популярные (галочка в админке), затем по одному товару с фото из каждого раздела
  const slides = (() => {
    const out = (popular.data ?? []).filter((p) => p.images[0])
    for (const p of catalog.data?.items ?? []) {
      if (out.length >= 8) break
      if (p.images[0] && !out.some((x) => x.id === p.id || x.category === p.category)) out.push(p)
    }
    // ждём оба запроса: иначе Swiper соберётся из части слайдов и перескочит при догрузке
    return popular.isPending || catalog.isPending ? [] : out
  })()
  const projects = useQuery(q.projects())
  const reviews = useQuery(q.reviews())
  const news = useQuery(q.pages('press'))
  const docs = useQuery(q.documents())
  const certs = (docs.data ?? []).filter((d) => d.kind === 'certificate' && d.preview?.endsWith('.webp')).slice(0, 3)

  return (
    <>
      {/* Первый экран: что это, что сделать, чем подтверждено */}
      <section className="relative isolate overflow-x-clip bg-brand-900 text-white">
        <BlueprintBg />
        <div className="container-page relative grid items-center gap-10 pt-10 pb-24 md:pt-14 md:pb-28 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div>
            <h1 className="text-balance text-4xl leading-[1.05] text-white sm:text-5xl md:text-6xl 2xl:text-7xl">Датчики давления и температуры для промышленности</h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">Производим и поставляем контрольно-измерительные приборы. Подберите модификацию онлайн и отправьте запрос цены.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a id="hero-cta" href="#podbor" className={buttonClass('primary', 'lg')}>Подобрать датчик</a>
              <button type="button" onClick={() => openPrice()} className={buttonClass('outline', 'lg', 'border-white text-white hover:bg-white hover:text-brand-900')}>Запросить цену</button>
            </div>
            <dl className="mt-10 grid gap-x-10 gap-y-4 border-t border-white/20 pt-6 text-sm sm:grid-cols-[repeat(3,auto)] sm:justify-start">
              <div><dt className="text-brand-100">Поставка</dt><dd className="mt-0.5 font-display text-xl font-semibold">от 1 штуки и под заказ</dd></div>
              <div><dt className="text-brand-100">Модификаций</dt><dd className="mt-0.5 font-display text-xl font-semibold">более 1000</dd></div>
              <div><dt className="text-brand-100">Межповерочный интервал</dt><dd className="mt-0.5 font-display text-xl font-semibold">5 лет</dd></div>
            </dl>
          </div>
          <HeroSlider items={slides} />
        </div>
      </section>

      {/* Подбор серии: наезжает на первый экран */}
      <section id="podbor" aria-label="Подбор серии" className="container-page relative z-10 -mt-14 scroll-mt-32">
        <QuickSelect />
      </section>

      {/* Каталог */}
      <section className="section container-page">
        <SectionHead title="Каталог продукции" action={<Link to="/catalog" className={more}>Весь каталог</Link>} />
        <Async query={categories} skeleton={<CardsSkeleton n={6} h="h-48" />}>
          {(cats) => (
            <ul className="grid grid-cols-2 gap-px border border-ink-200 bg-ink-200 lg:grid-cols-3 max-lg:[&>li:last-child:nth-child(odd)]:col-span-2">
              {cats.map((c) => (
                <li key={c.id} className="bg-white">
                  <Link to="/catalog/$category" params={{ category: c.id }} className="group flex h-full flex-col transition-colors duration-300 hover:bg-ink-50">
                    <span className="relative block h-32 sm:h-44">
                      {c.image && <img src={c.image} alt="" loading="lazy" className="absolute inset-4 size-[calc(100%-2rem)] object-contain mix-blend-multiply" />}
                    </span>
                    <span className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
                      <span className="font-display text-base font-semibold leading-snug text-brand-900 group-hover:text-brand-700 sm:text-xl">{c.name}</span>
                      <span className="mt-1 text-sm text-ink-600">{positions(c.count)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Async>
      </section>

      {/* Импортозамещение: главный довод завода */}
      <ImportSubstitution />

      {/* Преимущества: доводы слева, крупные цифры справа */}
      <section className="bg-ink-50">
        <div className="container-page section grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div>
            <h2 className="text-4xl md:text-5xl">Почему заказывают у нас</h2>
            <ul className="mt-8 space-y-5">
              {REASONS.map((r) => (
                <li key={r.t} className="border-l-4 border-accent-500 pl-4">
                  <p className="font-display text-xl font-bold text-brand-900">{r.t}</p>
                  <p className="mt-1 text-[1.0625rem] text-ink-700">{r.d}</p>
                </li>
              ))}
            </ul>
          </div>
          <dl className="grid grid-cols-2 gap-px self-start border border-ink-200 bg-ink-200 md:grid-cols-3">
            {FIGURES.map((f) => (
              <div key={f.v} className="flex flex-col bg-white p-5 md:p-6">
                <dd className="font-display text-3xl font-bold leading-none whitespace-nowrap text-brand-900 md:text-4xl">{f.v}</dd>
                <dt className="mt-2 text-base leading-snug text-ink-700">{f.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Документы: сертификаты как реальные артефакты */}
      <section>
        <div className="container-page section grid items-start gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div>
            <h2 className="text-3xl md:text-4xl">Документы на продукцию</h2>
            <p className="mt-3 max-w-md text-ink-600">Сертификаты, декларации, руководства, опросные листы и каталоги. Скачиваются без регистрации.</p>
            <Link to="/docs" className={buttonClass('secondary', 'lg', 'mt-6')}>Все документы</Link>
          </div>
          <Async query={docs} skeleton={<CardsSkeleton n={3} h="h-64" />} isEmpty={() => certs.length === 0} empty={<span />}>
            {() => (
              <ul className="grid grid-cols-3 gap-3 sm:gap-5">
                {certs.map((c) => (
                  <li key={c.id}>
                    <a href={c.file.url} target="_blank" rel="noreferrer" className="group block">
                      <img src={c.preview ?? ''} alt={c.title} className="aspect-[3/4] w-full border border-ink-200 bg-white object-cover object-top transition-colors group-hover:border-brand-500" />
                      <span className="mt-2 line-clamp-2 block text-sm leading-snug text-ink-800 group-hover:text-brand-700">{c.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Async>
        </div>
      </section>

      {/* Заказчики: крупные цифры и бегущая стена логотипов */}
      {projects.data && projects.data.length > 0 && <ClientsShowcase projects={projects.data} />}

      {/* Как заказать: шаги на одной линии */}
      <section className="section container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-4xl md:text-5xl">Как заказать</h2>
          <Link to="/catalog" className={more}>Перейти в каталог</Link>
        </div>
        <ol className="relative mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <span aria-hidden className="absolute top-7 right-0 left-0 hidden h-0.5 bg-ink-200 lg:block" />
          {STEPS.map((st, i) => (
            <li key={st.t} className="relative">
              <span className="relative grid size-14 place-items-center bg-brand-900 font-display text-2xl font-bold text-white ring-8 ring-white">{i + 1}</span>
              <h3 className="mt-5 text-xl">{st.t}</h3>
              <p className="mt-2 max-w-[19rem] text-[1.0625rem] leading-relaxed text-ink-700">{st.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Новости и отзывы: лента с датами и одна крупная цитата */}
      <section className="bg-ink-50">
        <div className="container-page section grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-4xl">Новости</h2><Link to="/press" className={more}>Все новости</Link></div>
            <Async query={news} skeleton={<CardsSkeleton n={3} h="h-16" />} isEmpty={(d) => d.length === 0}>
              {(list) => (
                <ul className="grid gap-px border border-ink-200 bg-ink-200">
                  {list.slice(0, 4).map((p) => {
                    const d = dayMonth(p.date)
                    return (
                      <li key={p.slug}>
                        <Link to="/press/$slug" params={{ slug: p.slug }} className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 bg-white px-5 py-4 transition-colors duration-300 hover:bg-brand-50/60">
                          <time dateTime={p.date} className="leading-tight">
                            <span className="block font-display text-3xl font-bold text-accent-500">{d.day}</span>
                            <span className="text-sm text-ink-500">{d.rest}</span>
                          </time>
                          <span className="font-display text-lg font-bold leading-snug text-brand-900 transition-colors duration-300 group-hover:text-brand-700">{p.title}</span>
                          <ArrowRight className="size-5 text-ink-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-700" aria-hidden />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Async>
          </div>
          <div>
            <div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-4xl">Отзывы</h2><Link to="/reviews" className={more}>Все отзывы</Link></div>
            <Async query={reviews} skeleton={<CardsSkeleton n={1} h="h-72" />} isEmpty={(d) => d.length === 0}>
              {(list) => {
                const r = list[0]
                return (
                  <figure className="relative bg-brand-900 p-7 text-white md:p-9">
                    <span aria-hidden className="absolute -top-6 right-5 font-display text-[9rem] leading-none text-white/[0.07]">»</span>
                    <blockquote className="relative line-clamp-[8] text-lg leading-relaxed text-brand-50">{quote(r.html)}</blockquote>
                    <figcaption className="relative mt-6 border-t border-white/20 pt-4">
                      <p className="font-display text-xl font-bold text-white">{r.company}</p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.9375rem]">
                        <Link to="/reviews" className="font-medium text-white underline underline-offset-4 hover:text-accent-400">Читать полностью</Link>
                        {r.image && <a href={r.image} target="_blank" rel="noreferrer" className="text-brand-100 hover:text-white">Скан письма</a>}
                        {list.length > 1 && <Link to="/reviews" className="text-brand-100 hover:text-white">Ещё {list.length - 1} в разделе отзывов</Link>}
                      </div>
                    </figcaption>
                  </figure>
                )
              }}
            </Async>
          </div>
        </div>
      </section>

      {/* Выход в каталог внизу страницы */}
      <section>
        <div className="container-page section grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:items-center lg:gap-16">
          <div>
            <h2 className="text-3xl md:text-4xl">Более 1000 модификаций в каталоге</h2>
            <p className="mt-3 max-w-md text-ink-600">Выберите серию, соберите обозначение в конфигураторе и отправьте запрос цены.</p>
            <Link to="/catalog" className={buttonClass('primary', 'lg', 'mt-6')}>Перейти в каталог<ArrowRight className="size-5" aria-hidden /></Link>
          </div>
          <ul className="grid gap-px border border-ink-200 bg-ink-200 sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
            {(categories.data ?? []).map((c) => (
              <li key={c.id}>
                <Link to="/catalog/$category" params={{ category: c.id }} className="group flex h-full items-center justify-between gap-3 bg-white px-5 py-4 transition-colors duration-300 hover:bg-brand-50/60">
                  <span className="font-medium text-brand-900 transition-colors duration-300 group-hover:text-brand-700">{c.name}</span>
                  <ArrowRight className="size-4 shrink-0 text-ink-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-700" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Контакты и форма */}
      <section className="bg-brand-900 text-white">
        <div className="container-page section grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="text-3xl text-white md:text-4xl">Остались вопросы?</h2>
            <p className="mt-3 max-w-md text-brand-100">Опишите задачу — инженеры подберут датчик и пришлют коммерческое предложение.</p>
            <address className="mt-8 space-y-2 border-t border-white/20 pt-6 not-italic">
              <p><a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`} className="font-display text-3xl font-semibold text-white hover:underline">{COMPANY.phone}</a></p>
              <p><a href={`mailto:${COMPANY.email}`} className="text-brand-100 hover:text-white">{COMPANY.email}</a></p>
              <p className="max-w-sm text-brand-100">{COMPANY.address}</p>
            </address>
          </div>
          <div className="bg-white p-6 text-ink-800 md:p-8">
            <LeadForm kind="contact" fields={['name', 'company', 'phone', 'email', 'comment']} required={['name', 'phone']} commentLabel="Задача или обозначение датчика" submitLabel="Отправить запрос" successTitle="Запрос отправлен" />
          </div>
        </div>
      </section>
    </>
  )
}
