import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const inputClass =
  'w-full rounded-sm border border-ink-300 bg-white px-3 text-sm text-ink-800 placeholder:text-ink-500 transition-colors hover:border-brand-300 focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 aria-[invalid=true]:border-danger'

export function Field({ label, error, children, htmlFor, hint }: { label: string; error?: string; children: ReactNode; htmlFor: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-brand-900">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-ink-500">{hint}</p>}
      {error && <p id={`${htmlFor}-err`} className="text-xs text-danger" role="alert">{error}</p>}
    </div>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, 'h-11', className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, 'min-h-24 py-2.5', className)} {...rest} />
}
