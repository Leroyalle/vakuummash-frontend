import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const tones = {
  neutral: 'bg-ink-100 text-ink-600',
  brand: 'bg-brand-50 text-brand-700',
  accent: 'bg-brand-50 text-brand-900',
  ok: 'bg-ok/10 text-ok',
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: keyof typeof tones; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  )
}
