import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Props = { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode; children: ReactNode; size?: "md" | "lg" | "xl"; tone?: "plain" | "brand" }

export function Modal({ open, onOpenChange, title, description, children, size = "md", tone = "plain" }: Props) {
  const brand = tone === "brand"
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-brand-950/60 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content data-size={size} className={cn('data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out fixed top-1/2 left-1/2 z-[61] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg data-[size=lg]:max-w-xl data-[size=xl]:max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md bg-white', brand ? '' : 'border border-ink-200 p-6')} data-lenis-prevent="">
          <div className={brand ? 'relative overflow-hidden bg-brand-500 px-6 pt-6 pb-5 text-white sm:px-8' : undefined}>
            {brand && <span aria-hidden className="absolute right-0 bottom-0 left-0 h-1 bg-accent-500" />}
            <Dialog.Title className={cn('pr-8 font-semibold', brand ? 'text-2xl text-white' : 'text-xl text-brand-900')}>{title}</Dialog.Title>
            <Dialog.Description asChild={!!description}>{description ? <div className={cn('mt-1.5', brand ? 'text-brand-50' : 'text-sm text-ink-600')}>{description}</div> : <span className="sr-only">{title}</span>}</Dialog.Description>
          </div>
          <Dialog.Close className={cn('absolute top-4 right-4 rounded-sm p-1', brand ? 'text-white hover:bg-white/15' : 'text-ink-500 hover:bg-ink-100')} aria-label="Закрыть">
            <X className="size-5" aria-hidden />
          </Dialog.Close>
          <div className={brand ? 'px-6 pt-5 pb-6 sm:px-8' : 'mt-5'}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
