import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { q } from '@/api/queries'
import { useCategories } from '@/api/useCategories'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'

const ANY = 'any'
const SIGNAL = 'Выходной сигнал'
const EX = 'Взрывозащита'

export function QuickSelect({ compact }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { categories } = useCategories()
  const [picked, setCategory] = useState<string | null>(null)
  const category = picked || categories[0]?.id || ''
  const [sub, setSub] = useState(ANY)
  const [signal, setSignal] = useState(ANY)
  const [ex, setEx] = useState(ANY)
  const [text, setText] = useState('')

  const cat = categories.find((c) => c.id === category)
  const facets = useQuery({ ...q.products({ category, perPage: 1 }), enabled: !!category })
  const signals = facets.data?.facets.attrs.find((a) => a.name === SIGNAL)?.values.map((v) => v.value) ?? []
  const exs = facets.data?.facets.attrs.find((a) => a.name === EX)?.values.map((v) => v.value) ?? []

  const go = () =>
    navigate({
      to: '/catalog/$category',
      params: { category },
      search: {
        sub: sub === ANY ? undefined : [sub],
        f: signal === ANY && ex === ANY ? undefined : { ...(signal === ANY ? {} : { [SIGNAL]: [signal] }), ...(ex === ANY ? {} : { [EX]: [ex] }) },
        q: text.trim() || undefined,
      },
    })

  return (
    <form onSubmit={(e) => { e.preventDefault(); void go() }} aria-label="Подбор товара" className="border border-ink-200 bg-white p-5 md:p-6">
      {!compact && <p className="mb-4 font-display text-xl font-semibold text-brand-900">Подбор серии</p>}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0 lg:flex-1">
          <Field label="Категория" htmlFor="qs-cat">
            <Select id="qs-cat" value={category} placeholder="Выберите категорию" onChange={(v) => { if (!v) return; setCategory(v); setSub(ANY); setSignal(ANY); setEx(ANY) }} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          </Field>
        </div>
        {(cat?.subcategories.length ?? 0) > 0 && (
          <div className="min-w-0 lg:flex-1">
            <Field label="Тип" htmlFor="qs-sub">
              <Select id="qs-sub" value={sub} onChange={setSub} options={[{ value: ANY, label: 'Любой' }, ...(cat?.subcategories ?? []).map((s) => ({ value: s.id, label: s.name }))]} />
            </Field>
          </div>
        )}
        {signals.length > 0 && (
          <div className="min-w-0 lg:flex-1">
            <Field label={SIGNAL} htmlFor="qs-signal">
              <Select id="qs-signal" value={signal} onChange={setSignal} options={[{ value: ANY, label: 'Любой' }, ...signals.map((s) => ({ value: s, label: s }))]} />
            </Field>
          </div>
        )}
        {exs.length > 0 && (
          <div className="min-w-0 lg:flex-1">
            <Field label={EX} htmlFor="qs-ex">
              <Select id="qs-ex" value={ex} onChange={setEx} options={[{ value: ANY, label: 'Любая' }, ...exs.map((s) => ({ value: s, label: s }))]} />
            </Field>
          </div>
        )}
        <div className="min-w-0 lg:flex-1">
          <Field label="Название или обозначение" htmlFor="qs-q">
            <Input id="qs-q" value={text} onChange={(e) => setText(e.target.value)} placeholder="например, VMP-ДИ" />
          </Field>
        </div>
        <Button type="submit" size="lg" className="w-full lg:w-auto"><Search className="size-4" aria-hidden />Подобрать</Button>
      </div>
    </form>
  )
}
