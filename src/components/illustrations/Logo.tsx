import { COMPANY } from '@/config'

export function Logo({ light }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-9" aria-hidden>
        <rect width="32" height="32" rx="6" fill={light ? '#fff' : '#0B2A55'} />
        <path d="M7 9l9 15 9-15" fill="none" stroke="#F26A1B" strokeWidth="3.5" strokeLinejoin="round" />
      </svg>
      <span className={`text-lg font-bold tracking-wide ${light ? 'text-white' : 'text-brand-900'}`}>{COMPANY.name}</span>
    </span>
  )
}
