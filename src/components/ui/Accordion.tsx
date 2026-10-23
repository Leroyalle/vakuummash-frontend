import * as A from '@radix-ui/react-accordion'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

export type AccItem = { id: string; title: string; content: ReactNode }

export function Accordion({ items }: { items: AccItem[] }) {
  return (
    <A.Root type="single" collapsible className="divide-y divide-ink-200 rounded-md border border-ink-200 bg-white">
      {items.map((i) => (
        <A.Item key={i.id} value={i.id}>
          <A.Header>
            <A.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-brand-900 hover:bg-ink-50">
              {i.title}
              <Plus className="size-5 shrink-0 text-accent-600 transition-transform group-data-[state=open]:rotate-45" aria-hidden />
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden data-[state=open]:animate-acc-down data-[state=closed]:animate-acc-up"><div className="px-5 pb-5 text-sm leading-relaxed text-ink-600">{i.content}</div></A.Content>
        </A.Item>
      ))}
    </A.Root>
  )
}
