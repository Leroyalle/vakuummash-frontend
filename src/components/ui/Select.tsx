import * as RS from '@radix-ui/react-select'
import { Check, ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

export type SelectOption = { value: string; label: string; disabled?: boolean; reason?: string }

type Props = {
  id?: string
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export function Select({ id, value, onChange, options, placeholder, className, ...rest }: Props) {
  return (
    <RS.Root value={value} onValueChange={onChange}>
      <RS.Trigger
        id={id}
        aria-label={rest['aria-label']}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-sm border border-ink-300 bg-white px-3 text-left text-sm',
          'hover:border-brand-300 focus-visible:ring-2 focus-visible:ring-accent-500/40 data-[placeholder]:text-ink-500',
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate"><RS.Value placeholder={placeholder} /></span>
        <RS.Icon><ChevronDown className="size-4 text-ink-500" aria-hidden /></RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content data-lenis-prevent="" position="popper" sideOffset={4} className="z-[70] data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out max-h-72 w-(--radix-select-trigger-width) overflow-hidden rounded-sm border border-ink-200 bg-white shadow-lg">
          <RS.Viewport className="p-1">
            {options.map((o) => (
              <RS.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="relative flex cursor-pointer select-none transition-colors duration-200 items-start gap-2 rounded-sm py-2 pr-2 pl-8 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-300 data-[highlighted]:bg-brand-50"
              >
                <RS.ItemIndicator className="absolute left-2 top-2.5"><Check className="size-4 text-accent-600" aria-hidden /></RS.ItemIndicator>
                <span className="flex-1">
                  <RS.ItemText>{o.label}</RS.ItemText>
                  {o.disabled && o.reason && (
                    <span className="mt-0.5 flex items-start gap-1 text-xs text-ink-500"><Info className="mt-0.5 size-3 shrink-0" aria-hidden />{o.reason}</span>
                  )}
                </span>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  )
}
