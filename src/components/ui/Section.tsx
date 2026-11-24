import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { BlueprintBg } from '@/components/illustrations/BlueprintBg'
import { BrandMark } from '@/components/illustrations/BrandMark'
import { cn } from '@/lib/cn'
import { EASE, item, rise, VIEWPORT } from '@/lib/motion'
import { useSeo } from '@/lib/seo'

export function SectionHead({ title, lead, action, light }: { title: string; lead?: string; action?: ReactNode; light?: boolean }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={VIEWPORT} className={cn('relative mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b pb-4', light ? 'border-white/20' : 'border-ink-200')}>
      {/* оранжевый штрих прочерчивается при появлении заголовка */}
      <motion.span aria-hidden variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.9, ease: EASE, delay: 0.15 } } }} className="absolute -bottom-px left-0 h-[3px] w-14 origin-left bg-accent-500" />
      <motion.div variants={item} className="max-w-2xl">
        <h2 className={cn('text-3xl md:text-4xl', light && 'text-white')}>{title}</h2>
        {lead && <p className={cn('mt-2 text-base', light ? 'text-brand-100' : 'text-ink-600')}>{lead}</p>}
      </motion.div>
      {action && <motion.div variants={item}>{action}</motion.div>}
    </motion.div>
  )
}

/** Синяя шапка страницы с фирменным знаком справа: сетка-чертёж, серп и «VM» из логотипа. */
export function HeaderBand({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden bg-brand-500 text-white [&_ol]:text-brand-50 [&_[aria-current]]:text-white [&_ol_a:hover]:text-white">
      <BlueprintBg drawing={false} />
      <BrandMark id="page-mark" className="top-1/2 right-[-6rem] hidden h-[190%] -translate-y-[46%] md:block lg:right-[-2rem] 2xl:right-[4%]" />
      <div className="container-page relative py-10 md:py-16">{children}</div>
    </div>
  )
}

export function PageHeader({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  useSeo({ title, description: lead && lead.length > 40 ? lead : undefined })
  return (
    <HeaderBand>
      {children}
      <motion.div initial="hidden" animate="show" className="overflow-hidden pb-1">
        <motion.h1 variants={rise(0.05)} className="mt-4 max-w-3xl text-5xl text-balance text-white md:text-6xl">{title}</motion.h1>
      </motion.div>
      {lead && <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.3 }} className="mt-4 max-w-2xl text-lg text-brand-50 md:text-xl">{lead}</motion.p>}
    </HeaderBand>
  )
}
