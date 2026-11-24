import { CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'

/* ---------- Уведомления: «Сохранено», «Не получилось» ---------- */
type Toast = { id: number; tone: 'ok' | 'error'; text: string }
const ToastCtx = createContext<((text: string, tone?: Toast['tone']) => void) | null>(null)
export const useToast = () => {
  const v = useContext(ToastCtx)
  if (!v) throw new Error('useToast outside provider')
  return v
}

/* ---------- Подтверждение опасных действий ---------- */
type ConfirmOpts = { title: string; text?: string; confirmLabel?: string }
const ConfirmCtx = createContext<((o: ConfirmOpts) => Promise<boolean>) | null>(null)
export const useConfirm = () => {
  const v = useContext(ConfirmCtx)
  if (!v) throw new Error('useConfirm outside provider')
  return v
}

export function AdminProviders({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)
  const push = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++seq.current
    setToasts((t) => [...t, { id, tone, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 8000 : 3500)
  }, [])

  const [ask, setAsk] = useState<{ opts: ConfirmOpts; resolve: (v: boolean) => void } | null>(null)
  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => setAsk({ opts, resolve })), [])
  const close = (v: boolean) => { ask?.resolve(v); setAsk(null) }
  const ctx = useMemo(() => push, [push])

  return (
    <ToastCtx.Provider value={ctx}>
      <ConfirmCtx.Provider value={confirm}>
        {children}
        <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex flex-col items-end gap-2" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className={cn('pointer-events-auto flex max-w-sm items-start gap-2 border px-4 py-3 text-sm shadow-lg', t.tone === 'ok' ? 'border-ok/40 bg-white text-ink-800' : 'border-danger/40 bg-white text-ink-800')}>
              {t.tone === 'ok' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />}
              <span>{t.text}</span>
              <button type="button" aria-label="Закрыть" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="ml-1 text-ink-500 hover:text-ink-800"><X className="size-4" aria-hidden /></button>
            </div>
          ))}
        </div>
        <Modal open={!!ask} onOpenChange={(o) => !o && close(false)} title={ask?.opts.title ?? ''} description={ask?.opts.text}>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => close(false)}>Отмена</Button>
            <Button className="bg-danger text-white hover:bg-danger/90" onClick={() => close(true)}>{ask?.opts.confirmLabel ?? 'Удалить'}</Button>
          </div>
        </Modal>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  )
}

/* ---------- Каркас страницы ---------- */
export function PageHead({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-ink-200 pb-5">
      <div className="max-w-2xl">
        <h1 className="text-3xl text-brand-900">{title}</h1>
        {lead && <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-600">{lead}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

export function EmptyBlock({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-ink-300 bg-white px-6 py-12 text-center">
      <p className="font-display text-xl font-semibold text-brand-900">{title}</p>
      {text && <p className="mx-auto mt-1.5 max-w-md text-[0.9375rem] text-ink-600">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

const chipTones = { ok: 'bg-ok/10 text-ok', neutral: 'bg-ink-100 text-ink-600', brand: 'bg-brand-50 text-brand-900', warn: 'bg-accent-500/15 text-brand-950' }
export function Chip({ tone = 'neutral', children }: { tone?: keyof typeof chipTones; children: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-sm font-medium', chipTones[tone])}>{children}</span>
}

/** Подсказка под полем простыми словами. */
export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-ink-500">{children}</p>
}

/** Блок формы с заголовком и пояснением. */
export function FormSection({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <section className="border border-ink-200 bg-white">
      <div className="border-b border-ink-100 px-5 py-4">
        <h2 className="text-xl text-brand-900">{title}</h2>
        {lead && <p className="mt-1 text-[0.9375rem] text-ink-600">{lead}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}
