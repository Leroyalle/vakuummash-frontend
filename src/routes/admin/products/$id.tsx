import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useBlocker, useNavigate } from '@tanstack/react-router'
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { admin, type AdminProduct } from '@/api/admin'
import { slugify } from '@/components/admin/ResourceAdmin'
import { ContentEditor, type FamilyContent } from '@/components/admin/ContentEditor'
import { errorText, ImagesField, TagsField } from '@/components/admin/primitives'
import { Chip, FormSection, useConfirm, useToast } from '@/components/admin/kit'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { resolve } from '@/configurator/engine'
import { Configurator } from '@/components/product/Configurator'
import type { ConfigField, ConfigOption, ConfigRule, ConfigSchema } from '@/configurator/types'
import { cn } from '@/lib/cn'

export const Route = createFileRoute('/admin/products/$id')({ component: ProductEditor })

const EMPTY: AdminProduct = {
  id: '', categoryId: '', name: '', summary: '', images: [], attributes: [], badges: [], content: {}, legacyText: '',
  price: null, featured: false, published: true, position: 0, config: null,
}

function ProductEditor() {
  const { id } = Route.useParams()
  const isNew = id === 'new'
  const product = useQuery({ queryKey: ['admin', 'product', id], queryFn: () => admin.product(id), enabled: !isNew })
  return (
    <>
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-1 text-[0.9375rem] font-medium text-brand-700 hover:underline"><ArrowLeft className="size-4" aria-hidden />Все товары</Link>
      {isNew ? <ProductForm key="new" initial={EMPTY} isNew /> : product.isPending ? <p className="text-ink-600">Загрузка…</p> : product.isError ? <p role="alert" className="text-danger">{errorText(product.error)}</p> : <ProductForm key={product.data.id + String(product.dataUpdatedAt)} initial={product.data} isNew={false} />}
    </>
  )
}

const SKELETON: ConfigSchema = { fields: [], rules: [], codeTemplate: '', basePrice: 0 }

const TABS = [
  { id: 'main', label: 'Название и цена' },
  { id: 'photos', label: 'Фотографии' },
  { id: 'text', label: 'Описание' },
  { id: 'variants', label: 'Выбор модификации' },
  { id: 'filters', label: 'Фильтры в каталоге' },
] as const
type TabId = (typeof TABS)[number]['id']

function ProductForm({ initial, isNew }: { initial: AdminProduct; isNew: boolean }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [v, setV] = useState<AdminProduct>(initial)
  const [tab, setTab] = useState<TabId>('main')
  const [base] = useState(() => JSON.stringify(initial))
  const dirty = JSON.stringify(v) !== base
  // уход со страницы с несохранёнными правками: спрашиваем (переходы внутри админки и закрытие вкладки)
  const savedRef = useRef(false)
  useBlocker({
    shouldBlockFn: async ({ current, next }) => {
      if (!dirty || savedRef.current || next.pathname === current.pathname) return false
      return !(await confirm({ title: 'Выйти без сохранения?', text: 'Несохранённые правки в этом товаре пропадут.', confirmLabel: 'Выйти без сохранения' }))
    },
    enableBeforeUnload: () => dirty && !savedRef.current,
  })
  const cats = useQuery({ queryKey: ['admin', 'categories'], queryFn: admin.categories })
  const set = <K extends keyof AdminProduct>(k: K, x: AdminProduct[K]) => setV((s) => ({ ...s, [k]: x }))

  const save = useMutation({
    mutationFn: async () => {
      if (!v.name.trim()) throw new Error('Укажите название товара')
      if (!v.categoryId) throw new Error('Выберите раздел каталога')
      // краткое описание дублируется в контенте страницы товара
      const { id, ...rest } = { ...v, content: { ...v.content, summary: v.summary } }
      return isNew ? admin.createProduct({ id: v.id || slugify(v.name, false), ...rest }) : admin.updateProduct(id, rest)
    },
    onSuccess: (p) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      void qc.invalidateQueries({ queryKey: ['products'] })
      void qc.invalidateQueries({ queryKey: ['product', p.id] })
      void qc.invalidateQueries({ queryKey: ['categories'] })
      toast(v.published ? 'Товар сохранён и показывается на сайте' : 'Товар сохранён, но скрыт с сайта')
      if (isNew) { savedRef.current = true; void navigate({ to: '/admin/products/$id', params: { id: p.id } }) }
      else qc.setQueryData(['admin', 'product', p.id], p)
    },
    onError: (e) => toast(errorText(e), 'error'),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
      <header className="sticky top-14 z-20 -mx-4 mb-6 border-b border-ink-200 bg-ink-50/95 px-4 py-4 backdrop-blur-sm md:-mx-8 md:px-8 lg:top-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1 basis-72">
            <h1 className="truncate text-2xl text-brand-900 md:text-3xl">{isNew ? 'Новый товар' : v.name || 'Товар'}</h1>
            <p className="text-sm text-ink-500">{dirty ? 'Есть несохранённые изменения' : isNew ? 'Заполните название, раздел и сохраните' : 'Все изменения сохранены'}</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[0.9375rem]"><input type="checkbox" className="size-5 accent-brand-900" checked={v.published} onChange={(e) => set('published', e.target.checked)} />Показывать на сайте</label>
          {!isNew && v.published && <Link to="/catalog/$category/$productId" params={{ category: v.categoryId, productId: v.id }} target="_blank" className={buttonClass('outline', 'md')}>Открыть на сайте</Link>}
          <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Сохраняем…' : 'Сохранить'}</Button>
        </div>
      </header>

      <div role="tablist" aria-label="Разделы карточки товара" className="mb-6 flex gap-1 overflow-x-auto border-b border-ink-200">
        {TABS.map((t) => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={cn('-mb-px shrink-0 border-b-2 px-4 py-3 text-[0.9375rem] font-medium', tab === t.id ? 'border-brand-900 text-brand-900' : 'border-transparent text-ink-600 hover:text-brand-900')}>{t.label}</button>
        ))}
      </div>

      {tab === 'main' && (
        <FormSection title="Название и цена" lead="Основные сведения: так товар выглядит в каталоге и в результатах поиска.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Название товара" htmlFor="p-name"><Input id="p-name" value={v.name} onChange={(e) => set('name', e.target.value)} /></Field></div>
            <Field label="Раздел каталога" htmlFor="p-cat" hint="В каком разделе искать товар"><Select id="p-cat" value={v.categoryId} onChange={(x) => set('categoryId', x)} placeholder="Выберите раздел" options={(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))} /></Field>
            <Field label="Цена, ₽" htmlFor="p-price" hint="Оставьте пустым, чтобы на сайте было «Цена по запросу»"><Input id="p-price" type="number" min={0} value={v.price ?? ''} onChange={(e) => set('price', e.target.value === '' ? null : Number(e.target.value))} /></Field>
            <div className="sm:col-span-2"><Field label="Короткое описание" htmlFor="p-sum" hint="Одно-два предложения: показывается на карточке товара в каталоге"><Textarea id="p-sum" value={v.summary} onChange={(e) => set('summary', e.target.value)} /></Field></div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 text-[0.9375rem]"><input type="checkbox" className="size-5 accent-brand-900" checked={v.featured} onChange={(e) => set('featured', e.target.checked)} />Показывать на главной среди популярных</label>
            </div>
            <Field label="Порядок в каталоге" htmlFor="p-pos" hint="Меньшее число — выше в списке"><Input id="p-pos" type="number" value={v.position} onChange={(e) => set('position', Number(e.target.value))} className="max-w-40" /></Field>
            <TagsField id="p-badges" label="Пометки на карточке" value={v.badges} onChange={(x) => set('badges', x)} hint="Через запятую, например: Ex, HART" />
            {isNew && <div className="sm:col-span-2"><Field label="Адрес страницы (необязательно)" htmlFor="p-id" hint="Латиницей. Если оставить пустым, создастся из названия"><Input id="p-id" value={v.id} onChange={(e) => set('id', e.target.value)} pattern="[a-z0-9]+(-[a-z0-9]+)*" className="max-w-sm font-mono" /></Field></div>}
          </div>
        </FormSection>
      )}

      {tab === 'photos' && (
        <FormSection title="Фотографии" lead="Первое фото показывается в каталоге, остальные на странице товара. Лучше всего подходят снимки на светлом фоне.">
          <ImagesField id="p-images" label="Фотографии товара" value={v.images} onChange={(x) => set('images', x)} />
        </FormSection>
      )}

      {tab === 'text' && (
        <FormSection title="Описание на странице товара" lead="Что клиент читает на странице товара: где применяется, особенности и технические характеристики.">
          <ContentEditor value={v.content as FamilyContent} autoOrder={(v.config?.fields.length ?? 0) >= 4} chosenLabels={v.config?.fields.map((f) => f.label) ?? []} onChange={(c) => set('content', c as Record<string, unknown>)} />
        </FormSection>
      )}

      {tab === 'variants' && (
        <FormSection title="Выбор модификации" lead="Здесь вы задаёте, что клиент может выбрать на странице товара (например, диапазон, выходной сигнал, исполнение). Из выбора автоматически собирается обозначение для заказа.">
          <ConfigEditor value={v.config} onChange={(x) => set('config', x)} />
        </FormSection>
      )}

      {tab === 'filters' && (
        <FormSection title="Фильтры в каталоге" lead="Характеристики, по которым клиенты отбирают товары слева в каталоге. Если у характеристики от 2 до 14 разных значений в разделе, она станет фильтром.">
          <AttributesEditor value={v.attributes} onChange={(x) => set('attributes', x)} />
        </FormSection>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">{tab !== 'main' && <Chip tone="brand">{TABS.find((t) => t.id === tab)?.label}</Chip>}</div>
        <div className="flex gap-2">
          {dirty && <Button variant="outline" onClick={async () => { if (await confirm({ title: 'Отменить изменения?', text: 'Все несохранённые правки в этом товаре пропадут.', confirmLabel: 'Отменить правки' })) setV(JSON.parse(base) as AdminProduct) }}>Отменить правки</Button>}
          <Button type="submit" size="lg" disabled={save.isPending}>{save.isPending ? 'Сохраняем…' : 'Сохранить'}</Button>
        </div>
      </div>
    </form>
  )
}

function AttributesEditor({ value, onChange }: { value: AdminProduct['attributes']; onChange: (v: AdminProduct['attributes']) => void }) {
  return (
    <div className="space-y-3">
      {value.map((a, i) => (
        <div key={i} className="grid items-end gap-3 sm:grid-cols-[14rem_1fr_auto]">
          <Field label="Параметр" htmlFor={`attr-n-${i}`}><Input id={`attr-n-${i}`} value={a.name} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
          <TagsField id={`attr-v-${i}`} label="Значения" value={a.values} onChange={(vals) => onChange(value.map((x, j) => (j === i ? { ...x, values: vals } : x)))} />
          <Button variant="ghost" aria-label={`Убрать параметр ${a.name}`} onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 className="size-4 text-danger" aria-hidden /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...value, { name: '', values: [] }])}><Plus className="size-4" aria-hidden />Добавить параметр</Button>
    </div>
  )
}

const move = <T,>(arr: T[], i: number, d: -1 | 1) => {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

function ChipPicker({ options, value, onChange, label }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}
            className={cn('rounded-full border px-2.5 py-1 text-xs transition-colors', on ? 'border-brand-900 bg-brand-900 text-white' : 'border-ink-300 bg-white hover:border-accent-500')}>{o.label || o.value}</button>
        )
      })}
    </div>
  )
}

/** Характеристики, которые опция добавляет в таблицу «параметр → значение». */
function SpecEditor({ value, onChange }: { value: Record<string, string> | undefined; onChange: (v: Record<string, string> | undefined) => void }) {
  const [rows, setRows] = useState<[string, string][]>(Object.entries(value ?? {}))
  const commit = (next: [string, string][]) => {
    setRows(next)
    const obj = Object.fromEntries(next.filter(([k]) => k.trim()))
    onChange(Object.keys(obj).length ? obj : undefined)
  }
  return (
    <div className="space-y-2">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex gap-2">
          <Input aria-label="Параметр" placeholder="Параметр" className="h-9" value={k} onChange={(e) => commit(rows.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} />
          <Input aria-label="Значение" placeholder="Значение" className="h-9" value={v} onChange={(e) => commit(rows.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} />
          <Button variant="ghost" size="sm" aria-label="Убрать характеристику" onClick={() => commit(rows.filter((_, j) => j !== i))}><Trash2 className="size-4" aria-hidden /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setRows([...rows, ['', '']])}><Plus className="size-4" aria-hidden />Характеристика</Button>
    </div>
  )
}

function RulesEditor({ config, onChange }: { config: ConfigSchema; onChange: (rules: ConfigRule[]) => void }) {
  const fieldOpts = config.fields.map((f) => ({ value: f.id, label: f.label || f.id }))
  const optsOf = (id: string) => config.fields.find((f) => f.id === id)?.options.map((o) => ({ value: o.value, label: o.label })) ?? []
  const set = (i: number, patch: Partial<ConfigRule>) => onChange(config.rules.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  if (config.fields.length < 2) return <p className="text-sm text-ink-500">Ограничения можно задать, когда параметров хотя бы два.</p>
  return (
    <div className="space-y-3">
      {config.rules.map((r, i) => (
        <div key={i} className="space-y-3 rounded-md border border-ink-200 bg-ink-50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[0.9375rem] font-medium text-brand-900">Если клиент выбрал</p>
              <Select aria-label="Поле условия" value={r.when.field} onChange={(f) => set(i, { when: { field: f, in: [] } })} options={fieldOpts} />
              <div className="mt-2"><ChipPicker label="Значения условия" options={optsOf(r.when.field)} value={r.when.in} onChange={(v) => set(i, { when: { ...r.when, in: v } })} /></div>
            </div>
            <div>
              <p className="mb-1 text-[0.9375rem] font-medium text-brand-900">то нельзя выбрать</p>
              <Select aria-label="Поле запрета" value={r.disable.field} onChange={(f) => set(i, { disable: { field: f, values: [] } })} options={fieldOpts} />
              <div className="mt-2"><ChipPicker label="Запрещённые значения" options={optsOf(r.disable.field)} value={r.disable.values} onChange={(v) => set(i, { disable: { ...r.disable, values: v } })} /></div>
            </div>
          </div>
          <div className="flex gap-2">
            <Input aria-label="Причина для клиента" placeholder="Почему нельзя (клиент увидит это пояснение)" value={r.reason} onChange={(e) => set(i, { reason: e.target.value })} />
            <Button variant="ghost" aria-label="Удалить правило" onClick={() => onChange(config.rules.filter((_, j) => j !== i))}><Trash2 className="size-4 text-danger" aria-hidden /></Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...config.rules, { when: { field: config.fields[0].id, in: [] }, disable: { field: config.fields[1].id, values: [] }, reason: '' }])}><Plus className="size-4" aria-hidden />Добавить ограничение</Button>
    </div>
  )
}

/** Внутренний код варианта: попадает в ссылку на конфигурацию, поэтому без «:» и «,». Пользователь его не видит. */
const nextValue = (f: ConfigField) => {
  let n = f.options.length + 1
  while (f.options.some((o) => o.value === `v${n}`)) n++
  return `v${n}`
}
const nextFieldId = (c: ConfigSchema) => {
  let n = c.fields.length + 1
  while (c.fields.some((f) => f.id === `p${n}`)) n++
  return `p${n}`
}

function OptionRow({ o, isDefault, onDefault, onChange, onRemove, onMove, canRemove }: { o: ConfigOption; isDefault: boolean; onDefault: () => void; onChange: (patch: Partial<ConfigOption>) => void; onRemove: () => void; onMove: (d: -1 | 1) => void; canRemove: boolean }) {
  const [open, setOpen] = useState(false)
  const specCount = Object.keys(o.spec ?? {}).length
  return (
    <div className="border-b border-ink-100 last:border-0">
      <div className="grid items-center gap-2 py-2 sm:grid-cols-[2.5rem_1fr_11rem_auto]">
        <label className="flex items-center justify-center" title="Выбрано сразу при открытии страницы">
          <input type="radio" className="size-4 accent-brand-900" checked={isDefault} onChange={onDefault} aria-label={`Выбрано сразу: ${o.label}`} />
        </label>
        <Input aria-label="Что видит клиент" placeholder="Например: 0…10 кПа" className="h-10" value={o.label} onChange={(e) => onChange({ label: e.target.value })} />
        <Input aria-label="Код в обозначении" placeholder="Например: 10" className="h-10 font-mono" value={o.codePart} onChange={(e) => onChange({ codePart: e.target.value })} />
        <div className="flex">
          <Button variant="ghost" size="sm" aria-label="Выше" onClick={() => onMove(-1)}><ArrowUp className="size-4" aria-hidden /></Button>
          <Button variant="ghost" size="sm" aria-label="Ниже" onClick={() => onMove(1)}><ArrowDown className="size-4" aria-hidden /></Button>
          <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen(!open)} title="Характеристики, которые добавляет этот вариант">
            <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden /><span className="sr-only">Характеристики варианта</span>{specCount > 0 && <span className="text-sm text-ink-500">{specCount}</span>}
          </Button>
          <Button variant="ghost" size="sm" aria-label="Удалить вариант" className="text-danger hover:bg-danger/10" disabled={!canRemove} onClick={onRemove}><Trash2 className="size-4" aria-hidden /></Button>
        </div>
      </div>
      {open && (
        <div className="mb-3 ml-10 border border-ink-200 bg-ink-50 p-3">
          <p className="mb-2 text-sm text-ink-600">Необязательно. Строки «параметр — значение», которые появятся в таблице «Ваша конфигурация», когда клиент выберет этот вариант.</p>
          <SpecEditor value={o.spec} onChange={(spec) => onChange({ spec })} />
        </div>
      )}
    </div>
  )
}

/** Как это выглядит на сайте: тот же компонент выбора, что у клиента. */
function Preview({ config }: { config: ConfigSchema }) {
  const [state, setState] = useState<Record<string, string>>({})
  let resolved
  try { resolved = resolve(config, state) } catch { return <p className="text-[0.9375rem] text-ink-500">Предпросмотр появится, когда у каждого параметра будет хотя бы один вариант.</p> }
  return (
    <div className="space-y-4">
      <Configurator schema={config} resolved={resolved} onChange={(id, v) => setState((s) => ({ ...s, [id]: v }))} />
      <div className="border border-ink-200 bg-white p-3">
        <p className="text-sm text-ink-500">Обозначение для заказа</p>
        <p className="mt-0.5 break-words font-mono text-[0.9375rem] font-medium text-brand-900">{resolved.code || '—'}</p>
      </div>
    </div>
  )
}

function ConfigEditor({ value, onChange }: { value: ConfigSchema | null; onChange: (v: ConfigSchema | null) => void }) {
  const confirm = useConfirm()
  const [expert, setExpert] = useState(false)

  if (!value) {
    return (
      <div className="space-y-3">
        <p className="text-[0.9375rem] text-ink-600">Сейчас у товара нет выбора: клиент видит одну модель. Если товар выпускается в разных исполнениях, настройте, что можно выбрать.</p>
        <Button variant="outline" onClick={() => onChange(SKELETON)}><Plus className="size-4" aria-hidden />Настроить выбор модификации</Button>
      </div>
    )
  }

  const setField = (i: number, patch: Partial<ConfigField>) => onChange({ ...value, fields: value.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) })
  const addField = () => {
    const id = nextFieldId(value)
    onChange({ ...value, fields: [...value.fields, { id, label: '', default: 'v1', options: [{ value: 'v1', label: '', codePart: '' }] }], codeTemplate: value.codeTemplate ? `${value.codeTemplate}-{${id}}` : `{${id}}` })
  }

  return (
    <div className="space-y-6">
      <div className="border border-brand-100 bg-brand-50 p-4 text-[0.9375rem] leading-relaxed text-brand-900">
        <p className="font-semibold">Как это работает</p>
        <p className="mt-1">На странице товара клиент выбирает <b>параметры</b> (например, «Модель», «Диапазон измерения», «Выходной сигнал»), у каждого параметра есть <b>варианты</b>. Из кодов выбранных вариантов автоматически собирается <b>обозначение для заказа</b>. Справа видно, как это выглядит у клиента.</p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          {value.fields.map((f, i) => (
            <section key={f.id} className="border border-ink-200 bg-white" aria-label={`Параметр ${f.label || i + 1}`}>
              <div className="flex flex-wrap items-end gap-3 border-b border-ink-100 bg-ink-50 px-4 py-3">
                <div className="min-w-56 flex-1"><Field label={`Параметр ${i + 1}: название`} htmlFor={`f-label-${f.id}`}><Input id={`f-label-${f.id}`} placeholder="Например: Диапазон измерения" value={f.label} onChange={(e) => setField(i, { label: e.target.value })} /></Field></div>
                <div className="flex">
                  <Button variant="ghost" aria-label="Параметр выше" onClick={() => onChange({ ...value, fields: move(value.fields, i, -1) })}><ArrowUp className="size-4" aria-hidden /></Button>
                  <Button variant="ghost" aria-label="Параметр ниже" onClick={() => onChange({ ...value, fields: move(value.fields, i, 1) })}><ArrowDown className="size-4" aria-hidden /></Button>
                  <Button variant="ghost" className="text-danger hover:bg-danger/10" onClick={async () => { if (await confirm({ title: `Удалить параметр «${f.label || i + 1}»?`, text: 'Вместе с ним удалятся все его варианты.' })) onChange({ ...value, fields: value.fields.filter((_, j) => j !== i), rules: value.rules.filter((r) => r.when.field !== f.id && r.disable.field !== f.id), codeTemplate: value.codeTemplate.replace(new RegExp(`-?\\{${f.id}\\}`), '') }) }}>Удалить</Button>
                </div>
                <div className="w-full"><Field label="Пояснение для клиента (необязательно)" htmlFor={`f-hint-${f.id}`}><Input id={`f-hint-${f.id}`} placeholder="Например: верхний предел измерения" value={f.hint ?? ''} onChange={(e) => setField(i, { hint: e.target.value || undefined })} /></Field></div>
              </div>
              <div className="px-4 pb-3">
                <div className="hidden gap-2 pt-3 pb-1 text-sm font-medium text-ink-500 sm:grid sm:grid-cols-[2.5rem_1fr_11rem_auto]">
                  <span className="text-center" title="Выбрано сразу при открытии страницы">Сразу</span><span>Вариант: что видит клиент</span><span>Код в обозначении</span><span className="w-40" />
                </div>
                {f.options.map((o, k) => (
                  <OptionRow key={o.value} o={o} isDefault={f.default === o.value} canRemove={f.options.length > 1}
                    onDefault={() => setField(i, { default: o.value })}
                    onChange={(patch) => setField(i, { options: f.options.map((x, j) => (j === k ? { ...x, ...patch } : x)) })}
                    onMove={(d) => setField(i, { options: move(f.options, k, d) })}
                    onRemove={() => setField(i, { default: f.default === o.value ? f.options.find((_, j) => j !== k)!.value : f.default, options: f.options.filter((_, j) => j !== k) })} />
                ))}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setField(i, { options: [...f.options, { value: nextValue(f), label: '', codePart: '' }] })}><Plus className="size-4" aria-hidden />Добавить вариант</Button>
              </div>
            </section>
          ))}
          <Button variant="outline" onClick={addField}><Plus className="size-4" aria-hidden />Добавить параметр</Button>

          <section className="border border-ink-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-brand-900">Что нельзя выбрать вместе</h3>
            <p className="mb-3 text-[0.9375rem] text-ink-600">Если какие-то варианты не сочетаются (например, малогабаритная модель не бывает с диапазоном 100 кПа), укажите это здесь. Клиент увидит такие варианты недоступными с вашим пояснением.</p>
            <RulesEditor config={value} onChange={(rules) => onChange({ ...value, rules })} />
          </section>

          <section className="border border-ink-200 bg-white">
            <button type="button" aria-expanded={expert} onClick={() => setExpert(!expert)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <span><span className="block font-semibold text-brand-900">Для специалиста</span><span className="text-sm text-ink-500">Порядок частей в обозначении, служебные коды, цены. Обычно трогать не нужно.</span></span>
              <ChevronDown className={cn('size-5 shrink-0 transition-transform', expert && 'rotate-180')} aria-hidden />
            </button>
            {expert && (
              <div className="space-y-4 border-t border-ink-100 p-4">
                <Field label="Схема обозначения" htmlFor="cfg-tpl" hint={`Коды параметров в фигурных скобках: ${value.fields.map((f) => `{${f.id}} — ${f.label || 'без названия'}`).join(', ')}`}>
                  <div className="flex gap-2"><Input id="cfg-tpl" className="font-mono" value={value.codeTemplate} onChange={(e) => onChange({ ...value, codeTemplate: e.target.value })} /><Button variant="outline" onClick={() => onChange({ ...value, codeTemplate: value.fields.map((f) => `{${f.id}}`).join('-') })}>Собрать по порядку</Button></div>
                </Field>
                <Field label="Базовая цена, ₽" htmlFor="cfg-base" hint="Используется, только если на сайте показываются цены"><Input id="cfg-base" type="number" min={0} className="max-w-48" value={value.basePrice} onChange={(e) => onChange({ ...value, basePrice: Number(e.target.value) })} /></Field>
                <div>
                  <p className="mb-2 text-[0.9375rem] font-medium text-brand-900">Надбавки к цене по вариантам</p>
                  {value.fields.map((f, i) => (
                    <div key={f.id} className="mb-3">
                      <p className="text-sm text-ink-500">{f.label || `Параметр ${i + 1}`}</p>
                      <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {f.options.map((o, k) => (
                          <label key={o.value} className="flex items-center gap-2 text-sm"><span className="min-w-0 flex-1 truncate">{o.label || o.value}</span>
                            <Input type="number" aria-label={`Надбавка: ${o.label}`} placeholder="+ ₽" className="h-9 w-24" value={o.priceDelta ?? ''} onChange={(e) => setField(i, { options: f.options.map((x, j) => (j === k ? { ...x, priceDelta: e.target.value === '' ? undefined : Number(e.target.value) } : x)) })} /></label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="text-danger hover:bg-danger/10" onClick={async () => { if (await confirm({ title: 'Отключить выбор модификации?', text: 'Все параметры и варианты будут удалены после сохранения товара.', confirmLabel: 'Отключить' })) onChange(null) }}>Отключить выбор модификации</Button>
              </div>
            )}
          </section>
        </div>

        <aside className="border border-ink-200 bg-ink-50 p-4 xl:sticky xl:top-40">
          <p className="mb-3 font-semibold text-brand-900">Так увидит клиент</p>
          <Preview config={value} />
        </aside>
      </div>
    </div>
  )
}
