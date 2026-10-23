import { cn } from '@/lib/cn'

/** Выводит очищенный HTML, подготовленный скриптом миграции (scripts/migrate/clean.ts). Источник — наш собственный JSON. */
export function Prose({ html, className }: { html: string; className?: string }) {
  if (!html) return null
  return <div className={cn('prose-content', className)} dangerouslySetInnerHTML={{ __html: html }} />
}
