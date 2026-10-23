import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'light'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700',
  secondary: 'bg-brand-900 text-white hover:bg-brand-700',
  outline: 'border border-brand-900/30 text-brand-900 hover:border-accent-500 hover:text-accent-700 bg-white',
  ghost: 'text-brand-900 hover:bg-ink-100',
  light: 'bg-white text-brand-900 hover:bg-ink-100',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra?: string) =>
  cn(
    'group/btn inline-flex items-center justify-center gap-2 rounded-sm font-medium transition duration-150 active:scale-[0.98]',
    'disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap',
    variants[variant],
    sizes[size],
    extra,
  )
