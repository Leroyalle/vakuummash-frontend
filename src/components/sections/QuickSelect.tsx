import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { categories, products } from '@/data'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'

const ANY = 'any'
const SIGNAL = 'Выходной сигнал'

export function QuickSelect({ compact }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [category, setCategory] = useState(categories[0].id)
  const [sub, setSub] = useState(ANY)
  const [signal, setSignal] = useState(ANY)
  const [text, setText] = useState('')

  const cat = categories.find((c) => c.id === category)!
  const signals = useMemo(
    () => [...new Set(products.filter((p) => p.category === category).flatMap((p) => p.attributes.filter((a) => a.name === SIGNAL).flatMap((a) => a.values)))].sort((a, b) => a.localeCompare(b, 'ru')),
    [category],
  )

  const go = () =>
    navigate({
      to: '/catalog/$category',
      params: { category },
      search: {
        sub: sub === ANY ? undefined : [sub],
        f: signal === ANY ? undefined : { [SIGNAL]: [signal] },
        q: text.trim() || undefined,
      },
    })

  return (
    <form onSubmit={(e) => { e.preventDefault(); void go() }} aria-label="Подбор товара" className="rounded-md border border-ink-200 bg-white p-5 shadow-lg md:p-6">
      {!compact && <p className="mb-4 font-semibold text-brand-900">Быстрый подбор</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto] lg:items-end">
        <Field label="Категория" htmlFor="qs-cat">
          <Select id="qs-cat" value={category} onChange={(v) => { setCategory(v); setSub(ANY); setSignal(ANY) }} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Тип" htmlFor="qs-sub">
          <Select id="qs-sub" value={sub} onChange={setSub} options={[{ value: ANY, label: 'Любой' }, ...cat.subcategories.map((s) => ({ value: s.id, label: s.name }))]} />
        </Field>
        <Field label={SIGNAL} htmlFor="qs-signal">
          <Select id="qs-signal" value={signal} onChange={setSignal} options={[{ value: ANY, label: signals.length ? 'Любой' : 'Не применяется' }, ...signals.map((s) => ({ value: s, label: s }))]} />
        </Field>
        <Field label="Название или обозначение" htmlFor="qs-q">
          <Input id="qs-q" value={text} onChange={(e) => setText(e.target.value)} placeholder="например, ТПП" />
        </Field>
        <Button type="submit" size="lg" className="sm:col-span-2 lg:col-span-1"><Search className="size-4" aria-hidden />Подобрать</Button>
      </div>
    </form>
  )
}
