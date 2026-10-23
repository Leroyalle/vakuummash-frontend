import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Reveal } from '@/components/motion/Reveal'

export function SectionHead({ eyebrow, title, lead, action, light }: { eyebrow?: string; title: string; lead?: string; action?: ReactNode; light?: boolean }) {
  return (
    <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className={cn('text-2xl md:text-3xl', light && 'text-white')}>{title}</h2>
        {lead && <p className={cn('mt-3 text-base', light ? 'text-brand-100' : 'text-ink-600')}>{lead}</p>}
      </div>
      {action}
    </Reveal>
  )
}

export function PageHeader({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="bg-brand-900 text-white grid-bg">
      <div className="container-page py-10 md:py-14">
        {children}
        <h1 className="mt-2 text-3xl text-white md:text-4xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-brand-100">{lead}</p>}
      </div>
    </div>
  )
}
