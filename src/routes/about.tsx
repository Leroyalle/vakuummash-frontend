import { createFileRoute, Link } from '@tanstack/react-router'
import { Award } from 'lucide-react'
import { documents } from '@/data'
import { PageContent } from '@/components/sections/PageContent'
import { ConsultBlock } from '@/components/sections/Common'
import { SectionHead } from '@/components/ui/Section'
import { buttonClass } from '@/components/ui/buttonStyles'

export const Route = createFileRoute('/about')({ component: About })

function About() {
  const certs = documents.filter((d) => d.kind === 'certificate').slice(0, 6)
  return (
    <>
      <PageContent slug="about" title="О компании" crumb="О компании">
        <div className="mt-12">
          <SectionHead eyebrow="Документы" title="Сертификаты" action={<Link to="/docs" search={{ type: 'certificate' }} className={buttonClass('outline', 'sm')}>Все документы</Link>} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((c) => (
              <li key={c.slug}><a href={c.file.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-md border border-ink-200 p-4 hover:border-accent-500">
                <span aria-hidden className="grid h-16 w-12 shrink-0 place-items-center rounded-sm border border-ink-300 bg-ink-50 text-accent-600"><Award className="size-5" /></span>
                <span className="text-sm font-medium text-brand-900">{c.title}</span></a></li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/vacancies" className={buttonClass('outline', 'md')}>Вакансии</Link>
            <Link to="/press" className={buttonClass('outline', 'md')}>Пресс-центр</Link>
            <Link to="/delivery" className={buttonClass('outline', 'md')}>Доставка</Link>
          </div>
        </div>
      </PageContent>
      <ConsultBlock />
    </>
  )
}
