import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useSeo } from '@/lib/seo'

export function SectionHead({ title, lead, action, light }: { title: string; lead?: string; action?: ReactNode; light?: boolean }) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b pb-4', light ? 'border-white/20' : 'border-ink-200')}>
      <div className="max-w-2xl">
        <h2 className={cn('text-3xl md:text-4xl', light && 'text-white')}>{title}</h2>
        {lead && <p className={cn('mt-2 text-base', light ? 'text-brand-100' : 'text-ink-600')}>{lead}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  useSeo({ title, description: lead && lead.length > 40 ? lead : undefined })
  return (
    <div className="border-b border-ink-200 bg-ink-50">
      <div className="container-page py-8 md:py-12">
        {children}
        <h1 className="mt-3 text-4xl md:text-5xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-ink-600">{lead}</p>}
      </div>
    </div>
  )
}
