import * as T from '@radix-ui/react-tabs'
import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { t } from '@/lib/motion'

export type TabItem = { value: string; label: string; content: ReactNode }

export function Tabs({ items, value, onChange }: { items: TabItem[]; value: string; onChange: (v: string) => void }) {
  const uid = useId()
  return (
    <T.Root value={value} onValueChange={onChange}>
      <T.List className="flex gap-1 overflow-x-auto border-b border-ink-200" aria-label="Разделы карточки">
        {items.map((i) => (
          <T.Trigger
            key={i.value}
            value={i.value}
            className="relative -mb-px shrink-0 px-4 py-3 text-sm font-medium text-ink-600 hover:text-brand-900 data-[state=active]:text-brand-900"
          >
            {i.label}
            {i.value === value && <motion.span layoutId={`tab-${uid}`} transition={t('base')} className="absolute inset-x-0 -bottom-px h-0.5 bg-accent-500" />}
          </T.Trigger>
        ))}
      </T.List>
      {items.map((i) => (
        <T.Content key={i.value} value={i.value} className="pt-6">{i.content}</T.Content>
      ))}
    </T.Root>
  )
}
