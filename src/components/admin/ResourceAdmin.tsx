import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { admin } from '@/api/admin'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { dateRu } from '@/lib/format'
import { EmptyBlock, PageHead, useConfirm, useToast } from './kit'
import { errorText, ImageField, ImagesField, TagsField, useUpload } from './primitives'
import { RichText } from './RichText'

type Kind = 'text' | 'textarea' | 'html' | 'number' | 'bool' | 'select' | 'date' | 'image' | 'images' | 'tags' | 'file'
export type FieldDef = { key: string; label: string; kind: Kind; options?: { value: string; label: string }[]; required?: boolean; nullable?: boolean; hint?: string }
export type ResourceDef = {
  type: string
  /** адрес API, если отличается от type (новости и вакансии — это страницы своего раздела) */
  endpoint?: string
  /** показывать только часть записей */
  filter?: (r: Record<string, unknown>) => boolean
  /** значения, которые всегда добавляются к сохраняемой записи (например, раздел) */
  fixed?: Record<string, unknown>
  title: string
  lead: string
  addLabel: string
  savedText: string
  emptyTitle: string
  emptyText: string
  fields: FieldDef[]
  /** первая колонка — заголовок строки, остальные — пояснения под ним */
  columns: string[]
  defaults: Record<string, unknown>
}

type Row = Record<string, unknown> & { id: string }

const formatCell = (f: FieldDef, v: unknown) => {
  if (v === null || v === undefined || v === '') return ''
  if (f.kind === 'date') return dateRu(String(v))
  if (f.kind === 'bool') return v ? 'Да' : ''
  if (f.kind === 'select') return f.options?.find((o) => o.value === v)?.label ?? String(v)
  if (f.kind === 'tags' || f.kind === 'images') return ''
  return String(v)
}

const TRANSLIT: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya' }
/** Адрес из заголовка: транслитерация + короткий суффикс против дублей. */
export const slugify = (s: string, suffix = true) => `${s.toLowerCase().split('').map((c) => TRANSLIT[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item'}${suffix ? `-${Date.now().toString(36).slice(-4)}` : ''}`

export function ResourceAdmin({ def, autoNew }: { def: ResourceDef; autoNew?: boolean }) {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const api = def.endpoint ?? def.type
  const list = useQuery({ queryKey: ['admin', api], queryFn: () => admin.list(api) })
  const [editing, setEditing] = useState<Row | 'new' | null>(autoNew ? 'new' : null)
  const [filter, setFilter] = useState('')

  const remove = useMutation({
    mutationFn: (id: string) => admin.remove(api, id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', api] }); toast('Запись удалена') },
    onError: (e) => toast(errorText(e), 'error'),
  })

  const cols = def.columns.map((k) => def.fields.find((f) => f.key === k)!)
  const needle = filter.trim().toLowerCase()
  const all = (list.data ?? []).filter((r) => !def.filter || def.filter(r))
  const rows = all.filter((r) => !needle || JSON.stringify(Object.values(r).filter((v) => typeof v === 'string')).toLowerCase().includes(needle))
  const add = <Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden />{def.addLabel}</Button>

  return (
    <>
      <PageHead title={def.title} lead={def.lead}>{all.length > 0 && add}</PageHead>

      {list.isPending ? <p className="text-ink-600">Загрузка…</p> : list.isError ? <p role="alert" className="text-danger">{errorText(list.error)}</p> : all.length === 0 ? (
        <EmptyBlock title={def.emptyTitle} text={def.emptyText} action={add} />
      ) : (
        <>
          <div className="mb-4 max-w-sm"><Input aria-label="Найти в списке" placeholder="Найти в списке" value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
          {rows.length === 0 ? <p className="text-ink-600">Ничего не найдено. Измените запрос.</p> : (
            <ul className="border border-ink-200 bg-white">
              {rows.map((r) => {
                const meta = cols.slice(1).map((c) => formatCell(c, r[c.key])).filter(Boolean)
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ink-100 px-5 py-3.5 last:border-0">
                    <button type="button" onClick={() => setEditing(r)} className="min-w-0 flex-1 basis-64 text-left">
                      <span className="block font-display text-lg font-semibold leading-snug text-brand-900 hover:text-brand-700">{formatCell(cols[0], r[cols[0].key]) || 'Без названия'}</span>
                      {meta.length > 0 && <span className="mt-0.5 block text-sm text-ink-500">{meta.join(', ')}</span>}
                    </button>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(r)}>Изменить</Button>
                      <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={async () => { if (await confirm({ title: 'Удалить запись?', text: `«${formatCell(cols[0], r[cols[0].key])}» исчезнет с сайта. Это действие нельзя отменить.` })) remove.mutate(r.id) }}>Удалить</Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-3 text-sm text-ink-500">Всего записей: {all.length}</p>
        </>
      )}

      {editing !== null && (
        <ResourceModal key={editing === 'new' ? 'new' : editing.id} def={def} initial={editing === 'new' ? def.defaults : editing} isNew={editing === 'new'} onClose={() => setEditing(null)}
          save={(body) => { const b = { ...body, ...def.fixed }; return editing === 'new' ? admin.create(api, b) : admin.update(api, editing.id, b) }}
          onSaved={() => { toast(def.savedText); setEditing(null); void qc.invalidateQueries({ queryKey: ['admin', api] }); void qc.invalidateQueries({ queryKey: ['pages'] }); void qc.invalidateQueries({ queryKey: ['page'] }) }} />
      )}
    </>
  )
}

function ResourceModal({ def, initial, isNew, save, onSaved, onClose }: { def: ResourceDef; initial: Record<string, unknown>; isNew: boolean; save: (body: Record<string, unknown>) => Promise<unknown>; onSaved: () => void; onClose: () => void }) {
  const confirm = useConfirm()
  const [v, setV] = useState<Record<string, unknown>>(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: string, x: unknown) => setV((s) => ({ ...s, [k]: x }))
  const dirty = JSON.stringify(v) !== JSON.stringify(initial)

  const tryClose = async () => {
    if (!dirty || (await confirm({ title: 'Закрыть без сохранения?', text: 'Внесённые изменения пропадут.', confirmLabel: 'Закрыть' }))) onClose()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {}
      for (const f of def.fields) {
        let x = v[f.key]
        if (f.kind === 'date' && typeof x === 'string' && x.length === 10) x = `${x}T00:00:00.000Z`
        if (f.kind === 'number') x = Number(x ?? 0)
        if (f.kind === 'file') {
          body.fileUrl = v.fileUrl; body.fileFormat = v.fileFormat; body.fileSizeKb = Number(v.fileSizeKb ?? 0)
          continue
        }
        if (x === '' && f.nullable) x = null
        if (x !== undefined) body[f.key] = x
      }
      // адрес страницы создаётся из названия автоматически
      if ('slug' in initial && !initial.slug) body.slug = slugify(String(v.title ?? v.company ?? ''))
      else delete body.slug
      await save(body)
      onSaved()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onOpenChange={(o) => !o && void tryClose()} title={isNew ? def.addLabel : 'Изменение записи'} description={isNew ? undefined : 'Не забудьте нажать «Сохранить»: изменения сразу появятся на сайте.'} size="xl">
      <form onSubmit={submit} className="space-y-5">
        {def.fields.map((f) => {
          const id = `res-${f.key}`
          return (
            <div key={f.key}>
              {f.kind === 'text' && <Field label={f.label} htmlFor={id} hint={f.hint}><Input id={id} value={String(v[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} required={f.required} /></Field>}
              {f.kind === 'number' && <Field label={f.label} htmlFor={id} hint={f.hint}><Input id={id} type="number" value={String(v[f.key] ?? 0)} onChange={(e) => set(f.key, e.target.value)} className="max-w-40" /></Field>}
              {f.kind === 'date' && <Field label={f.label} htmlFor={id} hint={f.hint}><Input id={id} type="date" value={String(v[f.key] ?? '').slice(0, 10)} onChange={(e) => set(f.key, e.target.value)} className="max-w-56" /></Field>}
              {f.kind === 'textarea' && <Field label={f.label} htmlFor={id} hint={f.hint}><Textarea id={id} rows={5} value={String(v[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} required={f.required} /></Field>}
              {f.kind === 'html' && <RichText id={id} label={f.label} minHeight={240} value={String(v[f.key] ?? '')} onChange={(x) => set(f.key, x)} />}
              {f.kind === 'bool' && <label className="flex items-center gap-2.5 text-[0.9375rem]"><input type="checkbox" className="size-5 accent-brand-900" checked={!!v[f.key]} onChange={(e) => set(f.key, e.target.checked)} />{f.label}</label>}
              {f.kind === 'select' && <Field label={f.label} htmlFor={id} hint={f.hint}><Select id={id} value={String(v[f.key] ?? '')} onChange={(x) => set(f.key, x)} options={f.options ?? []} /></Field>}
              {f.kind === 'image' && <ImageField id={id} label={f.label} value={(v[f.key] as string | null) ?? null} onChange={(x) => set(f.key, x)} />}
              {f.kind === 'images' && <ImagesField id={id} label={f.label} value={(v[f.key] as string[]) ?? []} onChange={(x) => set(f.key, x)} />}
              {f.kind === 'tags' && <TagsField id={id} label={f.label} value={(v[f.key] as string[]) ?? []} onChange={(x) => set(f.key, x)} hint={f.hint} />}
              {f.kind === 'file' && <FileField value={v} onChange={(patch) => setV((s) => ({ ...s, ...patch }))} />}
              {(f.kind === 'images' || f.kind === 'image') && f.hint && <p className="mt-1 text-sm text-ink-500">{f.hint}</p>}
            </div>
          )
        })}
        {error && <p role="alert" className="border border-danger/40 bg-danger/5 p-3 text-[0.9375rem] text-danger">Не получилось сохранить: {error}</p>}
        <div className="sticky -bottom-6 -mx-6 flex items-center justify-between gap-3 border-t border-ink-200 bg-white px-6 py-4">
          <span className="text-sm text-ink-500">{dirty ? 'Есть несохранённые изменения' : ''}</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void tryClose()}>Отмена</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function FileField({ value, onChange }: { value: Record<string, unknown>; onChange: (patch: Record<string, unknown>) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const { upload, busy, error } = useUpload()
  const has = !!value.fileUrl
  return (
    <Field label="Файл" htmlFor="res-file" hint="PDF или изображение, до 25 МБ">
      <div className="flex flex-wrap items-center gap-3 border border-ink-200 bg-ink-50 p-3">
        <input ref={ref} id="res-file" type="file" accept="application/pdf,image/*" className="sr-only" onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) { const r = await upload(f); if (r) onChange({ fileUrl: r.path, fileFormat: r.contentType === 'application/pdf' ? 'PDF' : r.contentType.split('/')[1].toUpperCase(), fileSizeKb: Math.max(1, Math.round(r.size / 1024)) }) }
          e.target.value = ''
        }} />
        <Button variant={has ? 'outline' : 'primary'} disabled={busy} onClick={() => ref.current?.click()}><Upload className="size-4" aria-hidden />{busy ? 'Загрузка…' : has ? 'Заменить файл' : 'Выбрать файл'}</Button>
        <span className="text-[0.9375rem] text-ink-600">{has ? `Загружен: ${String(value.fileFormat)}, ${String(value.fileSizeKb)} КБ` : 'Файл ещё не выбран'}</span>
        {error && <p role="alert" className="w-full text-sm text-danger">{error}</p>}
      </div>
    </Field>
  )
}
