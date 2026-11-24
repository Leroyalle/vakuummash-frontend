import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Fragment } from 'react'
import { q } from '@/api/queries'
import { HeroSlider } from '@/components/sections/HeroSlider'
import { BlueprintBg } from '@/components/illustrations/BlueprintBg'
import { HeroArc } from '@/components/illustrations/HeroArc'
import { LeadForm } from '@/components/forms/LeadForm'
import { useModals } from '@/components/forms/ModalsContext'
import { ClientsShowcase } from '@/components/sections/ClientsShowcase'
import { ImportSubstitution } from '@/components/sections/ImportSubstitution'
import { CardsSkeleton } from '@/components/sections/Common'
import { OrderSteps } from '@/components/sections/OrderSteps'
import { WorkStatus } from '@/components/sections/WorkStatus'
import { QuickSelect } from '@/components/sections/QuickSelect'
import { Async } from '@/components/ui/Async'
import { buttonClass } from '@/components/ui/buttonStyles'
import { SectionHead } from '@/components/ui/Section'
import { COMPANY } from '@/config'
import { item, revealList, stagger } from '@/lib/motion'

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
/** картинка товара «выдвигается» в плитку */
const pop = { hidden: { opacity: 0, scale: 0.9, y: 16 }, show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } } as const

/** строка ленты въезжает слева */
const slide = { hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } } as const

/** первый экран — коротко: всё на месте примерно за полсекунды */
const heroRise = { hidden: { y: '60%', opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } } as const
const heroItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } } as const

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
      <section className="relative isolate overflow-x-clip bg-brand-500 text-white">
        <BlueprintBg drawing={false} />
        <HeroArc />
        <div className="container-page relative grid items-center gap-10 pt-10 pb-24 md:pt-14 md:pb-28 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <motion.div initial="hidden" animate="show" variants={stagger(0.05)}>
            <div className="overflow-hidden pb-2">
              <motion.h1 variants={heroRise} className="text-balance text-4xl leading-[1.05] text-white sm:text-5xl md:text-6xl 2xl:text-7xl">Датчики давления для промышленности</motion.h1>
            </div>
            <motion.p variants={heroItem} className="mt-5 max-w-xl text-lg text-brand-50">Производим и поставляем контрольно-измерительные приборы. Подберите модификацию онлайн и отправьте запрос цены.</motion.p>
            <motion.div variants={heroItem} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a id="hero-cta" href="#podbor" className={buttonClass('primary', 'lg')}>Подобрать датчик</a>
              <button type="button" onClick={() => openPrice()} className={buttonClass('outline', 'lg', 'border-white text-white hover:bg-white hover:text-brand-900')}>Запросить цену</button>
            </motion.div>
            <motion.dl variants={heroItem} className="mt-10 grid gap-x-10 gap-y-4 border-t border-white/20 pt-6 text-sm sm:grid-cols-[repeat(3,auto)] sm:justify-start">
              <div><dt className="text-brand-50">Поставка</dt><dd className="mt-0.5 font-display text-xl font-semibold">от 1 штуки и под заказ</dd></div>
              <div><dt className="text-brand-50">Модификаций</dt><dd className="mt-0.5 font-display text-xl font-semibold">более 1000</dd></div>
              <div><dt className="text-brand-50">Межповерочный интервал</dt><dd className="mt-0.5 font-display text-xl font-semibold">5 лет</dd></div>
            </motion.dl>
          </motion.div>
          <HeroSlider items={slides} />
        </div>
      </section>

      {/* Подбор серии: наезжает на первый экран */}
      <section id="podbor" aria-label="Подбор серии" className="relative z-10 -mt-14 scroll-mt-32 bg-[linear-gradient(to_bottom,transparent_3.5rem,var(--color-brand-50)_3.5rem)]">
        <div className="container-page"><QuickSelect /></div>
      </section>

      {/* Каталог: самый большой раздел крупно, остальные рядом, внизу — подбор под задачу */}
      <section className="bg-brand-50">
        <div className="section container-page">
          <SectionHead title="Каталог продукции" action={<Link to="/catalog" className={more}>Весь каталог</Link>} />
          <Async query={categories} skeleton={<CardsSkeleton n={6} h="h-48" />}>
            {(cats) => {
              const [main, ...rest] = [...cats].sort((x, y) => y.count - x.count)
              if (!main) return null
              return (
                <>
                  <motion.div {...revealList(0.08)} className="grid gap-px border border-brand-100 bg-brand-100 lg:grid-cols-3">
                    <Link to="/catalog/$category" params={{ category: main.id }} className="group flex flex-col bg-white p-5 transition-colors duration-300 hover:bg-white sm:p-7">
                      <motion.span variants={pop} className="relative block h-48 sm:h-64 lg:flex-1">
                        {main.image && <img src={main.image} alt="" loading="lazy" className="absolute inset-0 size-full object-contain transition-transform duration-500 group-hover:scale-[1.04]" />}
                      </motion.span>
                      <span className="mt-6 block font-display text-2xl font-semibold text-brand-900 sm:text-3xl">{main.name}</span>
                      <span className="mt-1 block text-ink-600">{positions(main.count)}</span>
                      <span className="mt-5 inline-flex items-center gap-2 font-medium text-brand-700 group-hover:text-brand-900">Подобрать модификацию<ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></span>
                    </Link>
                    {rest.length > 0 && (
                      <motion.ul variants={stagger(0.08, 0.1)} className="grid grid-cols-2 gap-px bg-brand-100 lg:col-span-2 [&>li:last-child:nth-child(odd)]:col-span-2">
                        {rest.map((c) => (
                          <li key={c.id} className="bg-white">
                            <Link to="/catalog/$category" params={{ category: c.id }} className="group flex h-full flex-col p-4 sm:p-5">
                              <motion.span variants={pop} className="relative block h-28 sm:h-36">
                                {c.image && <img src={c.image} alt="" loading="lazy" className="absolute inset-0 size-full object-contain transition-transform duration-500 group-hover:scale-[1.04]" />}
                              </motion.span>
                              <span className="mt-4 block font-display text-base font-semibold leading-snug text-brand-900 group-hover:text-brand-700 sm:text-xl">{c.name}</span>
                              <span className="mt-1 block text-sm text-ink-600">{positions(c.count)}</span>
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </motion.div>
                  <button type="button" onClick={() => openPrice()} className="group flex w-full flex-col gap-3 bg-brand-500 px-5 py-5 text-left text-white transition-colors duration-300 hover:bg-brand-700 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <span>
                      <span className="font-display text-lg font-semibold sm:text-xl">Нет нужного прибора?</span>
                      <span className="text-brand-50 sm:ml-3">Изготовим по техническому заданию или чертежу — от одной штуки.</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-2 font-medium">Запрос на подбор<ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></span>
                  </button>
                </>
              )
            }}
          </Async>
        </div>
      </section>

      {/* Импортозамещение: главный довод завода */}
      <ImportSubstitution />

      {/* Преимущества: доводы слева, крупные цифры справа */}
      <section className="bg-ink-50">
        <div className="container-page section grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div>
            <h2 className="text-4xl md:text-5xl">Почему заказывают у нас</h2>
            <motion.ul {...revealList(0.12)} className="mt-8 space-y-5">
              {REASONS.map((r) => (
                <motion.li variants={item} key={r.t} className="border-l-4 border-accent-500 pl-4">
                  <p className="font-display text-xl font-bold text-brand-900">{r.t}</p>
                  <p className="mt-1 text-[1.0625rem] text-ink-700">{r.d}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
          <motion.dl {...revealList(0.06)} className="grid grid-cols-2 gap-px self-start border border-ink-200 bg-ink-200 md:grid-cols-3">
            {FIGURES.map((f) => (
              <motion.div variants={item} key={f.v} className="flex flex-col bg-white p-5 md:p-6">
                <dd className="font-display text-3xl font-bold leading-none whitespace-nowrap text-brand-900 md:text-4xl">{f.v}</dd>
                <dt className="mt-2 text-base leading-snug text-ink-700">{f.l}</dt>
              </motion.div>
            ))}
          </motion.dl>
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
              <motion.ul {...revealList(0.12)} className="grid grid-cols-3 gap-3 sm:gap-5">
                {certs.map((c, i) => (
                  <motion.li key={c.id} variants={{ hidden: { opacity: 0, y: 40, rotate: (i - 1) * 6 }, show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
                    <a href={c.file.url} target="_blank" rel="noreferrer" className="group block">
                      <img src={c.preview ?? ''} alt={c.title} className="aspect-[3/4] w-full border border-ink-200 bg-white object-cover object-top transition-colors group-hover:border-brand-500" />
                      <span className="mt-2 line-clamp-2 block text-sm leading-snug text-ink-800 group-hover:text-brand-700">{c.title}</span>
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
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
        <OrderSteps steps={STEPS} />
      </section>

      {/* Новости и отзывы: лента с датами и одна крупная цитата */}
      <section className="bg-ink-50">
        <div className="container-page section grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-4xl">Новости</h2><Link to="/press" className={more}>Все новости</Link></div>
            <Async query={news} skeleton={<CardsSkeleton n={3} h="h-16" />} isEmpty={(d) => d.length === 0}>
              {(list) => (
                <motion.ul {...revealList(0.1)} className="grid gap-px border border-ink-200 bg-ink-200">
                  {list.slice(0, 4).map((p) => {
                    const d = dayMonth(p.date)
                    return (
                      <li key={p.slug}>
                        <Link to="/press/$slug" params={{ slug: p.slug }} className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 bg-white px-5 py-4 transition-colors duration-300 hover:bg-brand-50/60">
                          <motion.time variants={slide} dateTime={p.date} className="leading-tight">
                            <span className="block font-display text-3xl font-bold text-accent-500">{d.day}</span>
                            <span className="text-sm text-ink-500">{d.rest}</span>
                          </motion.time>
                          <motion.span variants={slide} className="font-display text-lg font-bold leading-snug text-brand-900 transition-colors duration-300 group-hover:text-brand-700">{p.title}</motion.span>
                          <ArrowRight className="size-5 text-ink-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-700" aria-hidden />
                        </Link>
                      </li>
                    )
                  })}
                </motion.ul>
              )}
            </Async>
          </div>
          <div>
            <div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-4xl">Отзывы</h2><Link to="/reviews" className={more}>Все отзывы</Link></div>
            <Async query={reviews} skeleton={<CardsSkeleton n={1} h="h-72" />} isEmpty={(d) => d.length === 0}>
              {(list) => {
                const r = list[0]
                return (
                  <figure className="relative bg-brand-800 p-7 text-white md:p-9">
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
      <section className="relative overflow-hidden bg-brand-500 text-white">
        <BlueprintBg />
        <div className="container-page section relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
          <div>
            <h2 className="text-3xl text-white md:text-4xl">Остались вопросы?</h2>
            <p className="mt-3 max-w-md text-lg text-brand-50">Опишите задачу — инженеры подберут датчик и пришлют коммерческое предложение.</p>
            <dl className="mt-8 border-t border-white/25">
              <div className="border-b border-white/25 py-4">
                <dt className="text-sm text-brand-100">Телефон</dt>
                <dd><a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`} className="font-display text-[1.75rem] font-semibold text-white hover:underline">{COMPANY.phone}</a></dd>
              </div>
              <div className="border-b border-white/25 py-4">
                <dt className="text-sm text-brand-100">E-mail</dt>
                <dd><a href={`mailto:${COMPANY.email}`} className="text-lg font-medium text-white hover:underline">{COMPANY.email}</a></dd>
              </div>
              <div className="border-b border-white/25 py-4">
                <dt className="text-sm text-brand-100">Режим работы</dt>
                <dd><WorkStatus className="mt-1.5 mb-3 text-white" /></dd>
                <dd className="mt-1 grid grid-cols-[4.5rem_1fr] gap-y-0.5 text-white">
                  {COMPANY.hours.map(([d, t]) => <Fragment key={d}><span className="text-brand-100">{d}</span><span className="tabular-nums">{t}</span></Fragment>)}
                </dd>
              </div>
            </dl>
            <Link to="/contacts" className="mt-5 inline-flex items-center gap-1.5 font-medium text-white underline-offset-4 hover:underline">Адрес и контакты отделов<ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <motion.div initial={{ opacity: 0, x: 48 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="bg-white p-6 text-ink-800 md:p-8">
            <p className="mb-5 font-display text-xl font-semibold text-brand-900">Написать инженеру</p>
            <LeadForm kind="contact" layout="grid" fields={['name', 'phone', 'company', 'email', 'comment']} required={['name', 'phone']} commentLabel="Задача или обозначение датчика" commentPlaceholder="Например: датчик избыточного давления 0…1,6 МПа, 4–20 мА, 10 шт." submitLabel="Отправить запрос" successTitle="Запрос отправлен" />
          </motion.div>
        </div>
      </section>
    </>
  )
}
