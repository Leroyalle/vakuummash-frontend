import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode }

export function Modal({ open, onOpenChange, title, description, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-brand-950/60 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content className="data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out fixed top-1/2 left-1/2 z-[61] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md bg-white p-6 shadow-2xl" data-lenis-prevent="">
          <Dialog.Title className="pr-8 text-xl font-semibold text-brand-900">{title}</Dialog.Title>
          <Dialog.Description className={description ? 'mt-1 text-sm text-ink-600' : 'sr-only'}>{description ?? title}</Dialog.Description>
          <Dialog.Close className="absolute top-4 right-4 rounded-sm p-1 text-ink-500 hover:bg-ink-100" aria-label="Закрыть">
            <X className="size-5" aria-hidden />
          </Dialog.Close>
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
