import { AlertTriangle, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function EmptyState({ title = 'Ничего не найдено', text, action }: { title?: string; text?: string; action?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center rounded-md border border-dashed border-ink-300 px-6 py-14 text-center">
      <SearchX className="mb-3 size-10 text-ink-300" aria-hidden />
      <p className="font-semibold text-brand-900">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-ink-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry, text = 'Не удалось загрузить данные. Проверьте соединение и повторите попытку.' }: { onRetry?: () => void; text?: string }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-md border border-danger/30 bg-danger/5 px-6 py-14 text-center">
      <AlertTriangle className="mb-3 size-10 text-danger" aria-hidden />
      <p className="font-semibold text-brand-900">Ошибка загрузки</p>
      <p className="mt-1 max-w-md text-sm text-ink-600">{text}</p>
      {onRetry && <Button className="mt-4" variant="outline" onClick={onRetry}>Повторить</Button>}
    </div>
  )
}
