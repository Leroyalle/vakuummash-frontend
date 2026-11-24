import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'light'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-cta font-bold text-white hover:bg-cta-hover',
  secondary: 'bg-brand-500 text-white hover:bg-brand-600',
  outline: 'border-2 border-brand-500 text-brand-700 hover:border-brand-500 hover:bg-brand-500 hover:text-white bg-transparent',
  ghost: 'text-brand-900 hover:bg-ink-100',
  light: 'bg-white text-brand-900 hover:bg-ink-100',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-6 text-[1.0625rem]',
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra?: string) =>
  cn(
    'group/btn inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 active:translate-y-px',
    'disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap',
    variants[variant],
    sizes[size],
    // главная кнопка крупного размера — с фирменным блоком-стрелкой справа
    variant === 'primary' && size === 'lg' && 'btn-cta pr-[4.5rem]',
    extra,
  )
