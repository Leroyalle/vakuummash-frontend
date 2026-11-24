import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { q } from '@/api/queries'
import { ReadingProgress } from '@/components/motion/ReadingProgress'
import { SeoTag } from '@/components/SeoTag'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Async } from '@/components/ui/Async'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Prose } from '@/components/ui/Prose'
import { Skeleton } from '@/components/ui/Skeleton'
import { dateRu } from '@/lib/format'
import { excerpt } from '@/lib/seo'

export const Route = createFileRoute('/press/$slug')({ component: Article })

function Article() {
  const { slug } = Route.useParams()
  const query = useQuery(q.page(slug))
  const all = useQuery(q.pages('press'))
  return (
    <Async query={query} skeleton={<div className="container-page py-12"><Skeleton className="h-64" /></div>}>
      {(p) => {
        if (!p || p.group !== 'press') {
          return <div className="container-page py-20 text-center"><h1 className="text-3xl">Новость не найдена</h1><Link to="/press" className={buttonClass('primary', 'lg', 'mt-6')}>Все новости</Link></div>
        }
        const list = all.data ?? []
        const i = list.findIndex((x) => x.slug === p.slug)
        const newer = i > 0 ? list[i - 1] : null
        const older = i >= 0 && i < list.length - 1 ? list[i + 1] : null
        const others = list.filter((x) => x.slug !== p.slug).slice(0, 5)
        const [cover, ...gallery] = p.images
        return (
          <>
            <ReadingProgress />
            <SeoTag title={p.title} description={excerpt(p.html) || p.title} image={cover} jsonLd={{ '@context': 'https://schema.org', '@type': 'NewsArticle', headline: p.title, datePublished: p.date, image: p.images.slice(0, 1), author: { '@type': 'Organization', name: 'ВАКУУММАШ-ЭЛЕКТРО' } }} />
            <div className="border-b border-ink-200 bg-ink-50">
              <div className="container-page py-8 md:py-12">
                <Breadcrumbs items={[{ label: 'Новости', link: { to: '/press' } }, { label: p.title }]} />
                <time dateTime={p.date} className="mt-6 block text-[0.9375rem] text-ink-600">{dateRu(p.date)}</time>
                <h1 className="mt-2 max-w-4xl text-balance text-4xl md:text-5xl">{p.title}</h1>
              </div>
            </div>

            <div className="container-page grid gap-12 py-10 lg:grid-cols-[1fr_20rem]">
              <article className="min-w-0 max-w-[68ch]">
                {cover && <img src={cover} alt="" className="mb-8 w-full border border-ink-200 bg-white object-contain" />}
                <Prose html={p.html} className="text-[1.0625rem] leading-[1.7]" />
                {gallery.length > 0 && (
                  <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {gallery.map((src) => <li key={src}><a href={src} target="_blank" rel="noreferrer"><img src={src} alt="" loading="lazy" className="aspect-[4/3] w-full border border-ink-200 object-cover hover:border-brand-500" /></a></li>)}
                  </ul>
                )}
                <nav aria-label="Соседние новости" className="mt-12 grid gap-4 border-t border-ink-200 pt-6 sm:grid-cols-2">
                  {older ? <Link to="/press/$slug" params={{ slug: older.slug }} className="group"><span className="text-sm text-ink-600">Предыдущая</span><span className="mt-1 block font-display text-lg font-semibold leading-snug text-brand-900 group-hover:text-brand-700">{older.title}</span></Link> : <span />}
                  {newer && <Link to="/press/$slug" params={{ slug: newer.slug }} className="group sm:text-right"><span className="text-sm text-ink-600">Следующая</span><span className="mt-1 block font-display text-lg font-semibold leading-snug text-brand-900 group-hover:text-brand-700">{newer.title}</span></Link>}
                </nav>
                <Link to="/press" className="mt-8 inline-flex items-center gap-1.5 font-medium text-brand-700 hover:text-brand-900"><ArrowLeft className="size-4" aria-hidden />Все новости</Link>
              </article>

              {others.length > 0 && (
                <aside aria-labelledby="more-news" className="lg:sticky lg:top-32 lg:self-start">
                  <h2 id="more-news" className="border-b-2 border-brand-900 pb-2 text-2xl">Другие новости</h2>
                  <ul>
                    {others.map((x) => (
                      <li key={x.slug} className="border-b border-ink-200">
                        <Link to="/press/$slug" params={{ slug: x.slug }} className="group block py-3">
                          <time dateTime={x.date} className="text-sm text-ink-600">{dateRu(x.date)}</time>
                          <span className="mt-0.5 block font-display text-lg font-semibold leading-snug text-brand-900 group-hover:text-brand-700">{x.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}
            </div>
          </>
        )
      }}
    </Async>
  )
}
