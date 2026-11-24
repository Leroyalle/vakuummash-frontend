import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { admin } from '@/api/admin'
import { ApiError, mediaUrl } from '@/api/http'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { cn } from '@/lib/cn'

export const errorText = (e: unknown) => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Неизвестная ошибка')

export function AdminHeading({ title, children, lead }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl text-brand-900">{title}</h1>
        {lead && <p className="mt-1 text-sm text-ink-600">{lead}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export function Notice({ tone, children }: { tone: 'error' | 'ok'; children: ReactNode }) {
  return <p role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-sm border p-3 text-sm', tone === 'error' ? 'border-danger/30 bg-danger/5 text-danger' : 'border-ok/30 bg-ok/10 text-ok')}>{children}</p>
}

/** Таблица в прокручиваемой обёртке (relative — чтобы sr-only ячейки не расширяли страницу). */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="relative overflow-x-auto rounded-md border border-ink-200 bg-white"><table className="w-full text-left text-sm">{children}</table></div>
}
export const Th = ({ children, className }: { children?: ReactNode; className?: string }) => <th scope="col" className={cn('border-b border-ink-200 bg-ink-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-600', className)}>{children}</th>
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn('border-b border-ink-100 px-3 py-2.5 align-middle', className)}>{children}</td>

export function Pager({ page, perPage, total, onPage }: { page: number; perPage: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / perPage))
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink-600">
      <span>Всего: {total}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Назад</Button>
        <span>{page} / {pages}</span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Вперёд</Button>
      </div>
    </div>
  )
}

/** Выбор файла: загружает в MinIO через API и возвращает путь `/assets/...`. */
export function useUpload() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      return await admin.upload(file)
    } catch (e) {
      setError(errorText(e))
      return null
    } finally {
      setBusy(false)
    }
  }
  return { upload, busy, error }
}

export function ImageField({ label, id, value, onChange }: { label: string; id: string; value: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const { upload, busy, error } = useUpload()
  return (
    <Field label={label} htmlFor={id}>
      <div className="flex items-center gap-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-sm border border-ink-200 bg-ink-50">
          {value ? <img src={mediaUrl(value)} alt="" className="size-full object-contain" /> : <ImagePlus className="size-5 text-ink-300" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} placeholder="/assets/…" className="h-9 font-mono text-xs" />
          <div className="flex gap-2">
            <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" aria-label={`${label}: выбрать файл`} onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const r = await upload(f); if (r) onChange(r.path) } e.target.value = '' }} />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => ref.current?.click()}><Upload className="size-4" aria-hidden />{busy ? 'Загрузка…' : 'Загрузить'}</Button>
            {value && <Button size="sm" variant="ghost" onClick={() => onChange(null)}><Trash2 className="size-4" aria-hidden />Убрать</Button>}
          </div>
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        </div>
      </div>
    </Field>
  )
}

export function ImagesField({ label, id, value, onChange }: { label: string; id: string; value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const { upload, busy, error } = useUpload()
  return (
    <Field label={label} htmlFor={id}>
      <div className="space-y-2">
        <ul className="flex flex-wrap gap-2">
          {value.map((v, i) => (
            <li key={`${v}-${i}`} className="group relative size-20 overflow-hidden rounded-sm border border-ink-200 bg-ink-50">
              <img src={mediaUrl(v)} alt="" className="size-full object-contain" />
              <button type="button" aria-label={`Убрать изображение ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 rounded-sm bg-white/90 p-1 text-danger opacity-0 shadow group-hover:opacity-100 focus:opacity-100"><Trash2 className="size-3.5" aria-hidden /></button>
            </li>
          ))}
        </ul>
        <input id={id} ref={ref} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={async (e) => {
          const next = [...value]
          for (const f of Array.from(e.target.files ?? [])) { const r = await upload(f); if (r) next.push(r.path) }
          onChange(next)
          e.target.value = ''
        }} />
        <Button size="sm" variant="outline" disabled={busy} onClick={() => ref.current?.click()}><ImagePlus className="size-4" aria-hidden />{busy ? 'Загрузка…' : 'Добавить изображения'}</Button>
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      </div>
    </Field>
  )
}

export function TagsField({ label, id, value, onChange, hint }: { label: string; id: string; value: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [text, setText] = useState(value.join(', '))
  return (
    <Field label={label} htmlFor={id} hint={hint ?? 'Через запятую'}>
      <Input id={id} value={text} onChange={(e) => { setText(e.target.value); onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean)) }} />
    </Field>
  )
}
