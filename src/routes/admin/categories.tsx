import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useState } from 'react'
import { admin, type AdminCategory } from '@/api/admin'
import { EmptyBlock, PageHead, useConfirm, useToast } from '@/components/admin/kit'
import { slugify } from '@/components/admin/ResourceAdmin'
import { errorText } from '@/components/admin/primitives'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'

export const Route = createFileRoute('/admin/categories')({ component: Categories })

const pluralGoods = (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'товар' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'товара' : 'товаров'}`

function Categories() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const list = useQuery({ queryKey: ['admin', 'categories'], queryFn: admin.categories })
  const [name, setName] = useState('')
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); void qc.invalidateQueries({ queryKey: ['categories'] }) }
  const fail = (e: unknown) => toast(errorText(e), 'error')

  const create = useMutation({
    mutationFn: () => admin.createCategory({ id: slugify(name, false), name: name.trim(), icon: 'plug', position: (list.data?.length ?? 0) }),
    onSuccess: () => { setName(''); refresh(); toast('Раздел добавлен') }, onError: fail,
  })
  const remove = useMutation({ mutationFn: (id: string) => admin.deleteCategory(id), onSuccess: () => { refresh(); toast('Раздел удалён') }, onError: fail })
  const swap = useMutation({
    mutationFn: async ([a, b]: [AdminCategory, AdminCategory]) => {
      await admin.updateCategory(a.id, { name: a.name, icon: a.icon, position: b.position })
      await admin.updateCategory(b.id, { name: b.name, icon: b.icon, position: a.position })
    },
    onSuccess: refresh, onError: fail,
  })
  const rename = useMutation({ mutationFn: (c: AdminCategory & { name: string }) => admin.updateCategory(c.id, { name: c.name, icon: c.icon, position: c.position }), onSuccess: () => { refresh(); toast('Название сохранено') }, onError: fail })

  const items = [...(list.data ?? [])].sort((a, b) => a.position - b.position)

  return (
    <>
      <PageHead title="Разделы каталога" lead="Товары на сайте сгруппированы по разделам. Раздел появляется на сайте, когда в нём есть хотя бы один показываемый товар. Порядок здесь — порядок на сайте." />

      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) create.mutate() }} className="mb-6 flex flex-wrap items-end gap-3 border border-ink-200 bg-white p-4">
        <label className="min-w-64 flex-1"><span className="mb-1.5 block text-[0.9375rem] font-medium text-brand-900">Новый раздел</span><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Датчики уровня" /></label>
        <Button type="submit" disabled={!name.trim() || create.isPending}><Plus className="size-4" aria-hidden />Добавить раздел</Button>
      </form>

      {list.isPending ? <p className="text-ink-600">Загрузка…</p> : list.isError ? <p className="text-danger">{errorText(list.error)}</p> : items.length === 0 ? (
        <EmptyBlock title="Разделов пока нет" text="Добавьте первый раздел, затем товары в нём." />
      ) : (
        <ul className="border border-ink-200 bg-white">
          {items.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
              <div className="flex shrink-0">
                <Button variant="ghost" size="sm" aria-label={`Поднять «${c.name}» выше`} disabled={i === 0 || swap.isPending} onClick={() => swap.mutate([c, items[i - 1]])}><ArrowUp className="size-4" aria-hidden /></Button>
                <Button variant="ghost" size="sm" aria-label={`Опустить «${c.name}» ниже`} disabled={i === items.length - 1 || swap.isPending} onClick={() => swap.mutate([c, items[i + 1]])}><ArrowDown className="size-4" aria-hidden /></Button>
              </div>
              <NameCell key={`${c.id}:${c.name}`} c={c} onSave={(n) => rename.mutate({ ...c, name: n })} />
              <span className="text-[0.9375rem] text-ink-500">{pluralGoods(c.count)}</span>
              <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={async () => { if (await confirm({ title: `Удалить раздел «${c.name}»?`, text: c.count > 0 ? 'В разделе есть товары: сначала перенесите или удалите их.' : 'Раздел будет удалён.' })) remove.mutate(c.id) }}>Удалить</Button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function NameCell({ c, onSave }: { c: AdminCategory; onSave: (name: string) => void }) {
  const [v, setV] = useState(c.name)
  return (
    <div className="flex min-w-64 flex-1 gap-2">
      <Input aria-label={`Название раздела ${c.name}`} value={v} onChange={(e) => setV(e.target.value)} className="h-10" />
      {v.trim() && v !== c.name && <Button variant="outline" size="sm" className="h-10" onClick={() => onSave(v.trim())}>Сохранить</Button>}
    </div>
  )
}
