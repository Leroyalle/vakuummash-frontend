import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import { admin } from '@/api/admin'
import { mediaUrl } from '@/api/http'
import { Chip, EmptyBlock, PageHead, useConfirm, useToast } from '@/components/admin/kit'
import { errorText, Pager } from '@/components/admin/primitives'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Input } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { rub } from '@/lib/format'

export const Route = createFileRoute('/admin/products/')({
  validateSearch: z.object({ q: z.string().optional().catch(undefined), categoryId: z.string().optional().catch(undefined), page: z.number().int().min(1).optional().catch(undefined) }),
  component: Products,
})

const ALL = 'all'

function Products() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const cats = useQuery({ queryKey: ['admin', 'categories'], queryFn: admin.categories })
  const list = useQuery({ queryKey: ['admin', 'products', search], queryFn: () => admin.products(search), placeholderData: (p) => p })
  const remove = useMutation({
    mutationFn: (id: string) => admin.deleteProduct(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'products'] }); void qc.invalidateQueries({ queryKey: ['products'] }); toast('Товар удалён') },
    onError: (e) => toast(errorText(e), 'error'),
  })
  const catName = (id: string) => cats.data?.find((c) => c.id === id)?.name ?? ''
  const add = <Link to="/admin/products/$id" params={{ id: 'new' }} className={buttonClass('primary', 'md')}><Plus className="size-4" aria-hidden />Добавить товар</Link>

  return (
    <>
      <PageHead title="Товары" lead="Каталог продукции. Откройте товар, чтобы изменить фото, описание, цену или варианты исполнения.">{add}</PageHead>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_16rem]">
        <Input aria-label="Найти товар" placeholder="Найти по названию" defaultValue={search.q} onKeyDown={(e) => e.key === 'Enter' && void navigate({ search: { ...search, q: e.currentTarget.value || undefined, page: undefined } })} onBlur={(e) => e.currentTarget.value !== (search.q ?? '') && void navigate({ search: { ...search, q: e.currentTarget.value || undefined, page: undefined } })} />
        <Select aria-label="Раздел каталога" value={search.categoryId ?? ALL} onChange={(v) => void navigate({ search: { ...search, categoryId: v === ALL ? undefined : v, page: undefined } })} options={[{ value: ALL, label: 'Все разделы' }, ...(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
      </div>

      {list.isPending ? <p className="text-ink-600">Загрузка…</p> : list.isError ? <p className="text-danger">{errorText(list.error)}</p> : list.data.items.length === 0 ? (
        <EmptyBlock title="Ничего не найдено" text="Измените запрос или добавьте новый товар." action={add} />
      ) : (
        <>
          <ul className="border border-ink-200 bg-white">
            {list.data.items.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-ink-100 px-4 py-3 last:border-0">
                <Link to="/admin/products/$id" params={{ id: p.id }} className="grid size-14 shrink-0 place-items-center border border-ink-100 bg-white">{p.images[0] ? <img src={mediaUrl(p.images[0])} alt="" className="max-h-12 max-w-12 object-contain" /> : <span className="text-xs text-ink-300">нет фото</span>}</Link>
                <Link to="/admin/products/$id" params={{ id: p.id }} className="min-w-0 flex-1 basis-64">
                  <span className="block font-display text-lg font-semibold leading-snug text-brand-900 hover:text-brand-700">{p.name}</span>
                  <span className="block text-sm text-ink-500">{catName(p.category)}{p.hasConfig ? ', есть выбор модификации' : ''}</span>
                </Link>
                <span className="w-32 text-[0.9375rem] text-ink-600">{p.price === null ? 'Цена по запросу' : rub(p.price)}</span>
                <Chip tone={p.published ? 'ok' : 'neutral'}>{p.published ? 'На сайте' : 'Скрыт'}</Chip>
                <div className="flex gap-2">
                  <Link to="/admin/products/$id" params={{ id: p.id }} className={buttonClass('outline', 'sm')}>Изменить</Link>
                  <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={async () => { if (await confirm({ title: 'Удалить товар?', text: `«${p.name}» пропадёт из каталога. Это действие нельзя отменить. Если товар нужно только скрыть, откройте его и снимите галочку «Показывать на сайте».` })) remove.mutate(p.id) }}>Удалить</Button>
                </div>
              </li>
            ))}
          </ul>
          <Pager page={list.data.page} perPage={list.data.perPage} total={list.data.total} onPage={(p) => void navigate({ search: { ...search, page: p } })} />
        </>
      )}
    </>
  )
}
