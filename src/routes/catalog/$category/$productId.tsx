import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { Check, Copy, Download, FileText, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { q } from '@/api/queries'
import { PRICE_MODE } from '@/config'
import { decodeCfg, encodeCfg, normalize, qtyDiscount, resolve } from '@/configurator/engine'
import { categories, docKindLabels, documents, products } from '@/data'
import type { Product } from '@/data/types'
import { rub } from '@/lib/format'
import { ProductCard, ProductCardSkeleton, ProductImage } from '@/components/catalog/ProductCard'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Configurator } from '@/components/product/Configurator'
import { OrderCode } from '@/components/product/OrderCode'
import { motion } from 'motion/react'
import { t } from '@/lib/motion'
import { SpecTable } from '@/components/product/SpecTable'
import { Async } from '@/components/ui/Async'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Prose } from '@/components/ui/Prose'
import { SectionHead } from '@/components/ui/Section'
import { Accordion } from '@/components/ui/Accordion'
import { Tabs } from '@/components/ui/Tabs'
import { useModals } from '@/components/forms/ModalsContext'
import { ReviewCard } from '@/components/sections/Common'
import { cn } from '@/lib/cn'

const tabs = ['description', 'specs', 'order', 'docs', 'reviews'] as const

export const Route = createFileRoute('/catalog/$category/$productId')({
  validateSearch: z.object({
    cfg: z.string().optional().catch(undefined),
    qty: z.number().int().min(1).max(9999).optional().catch(undefined),
    tab: z.enum(tabs).optional().catch(undefined),
  }),
  beforeLoad: ({ params }) => {
    const p = products.find((x) => x.id === params.productId)
    if (!p || p.category !== params.category) throw notFound()
  },
  component: ProductPage,
})

function ProductPage() {
  const { productId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { openPrice } = useModals()
  const query = useQuery(q.product(productId))
  return (
    <Async query={query} skeleton={<div className="container-page py-10"><div className="h-96 animate-pulse rounded-md bg-ink-100" /></div>}>
      {(p) => (p ? <ProductView key={p.id} p={p} search={search} navigate={navigate} openPrice={openPrice} /> : null)}
    </Async>
  )
}

type ViewProps = {
  p: Product
  search: { cfg?: string; qty?: number; tab?: (typeof tabs)[number] }
  navigate: ReturnType<typeof Route.useNavigate>
  openPrice: ReturnType<typeof useModals>['openPrice']
}

const SCOPE_BY_CATEGORY: Record<string, string> = { 'datchiki-davleniya': 'pressure', 'datchiki-temperatury': 'temperature' }

function ProductView({ p, search, navigate, openPrice }: ViewProps) {
  const cat = categories.find((c) => c.id === p.category)!
  const [image, setImage] = useState(0)
  const resolved = useMemo(() => (p.schema ? resolve(p.schema, decodeCfg(search.cfg)) : null), [p.schema, search.cfg])
  const qty = search.qty ?? 1
  const discount = qtyDiscount(qty)
  const hasPrice = PRICE_MODE === 'show' && p.price !== null
  const unit = Math.round(((p.price ?? 0) + (resolved ? resolved.price - p.schema!.basePrice : 0)) * (1 - discount))
  const total = unit * qty
  const code = resolved?.code ?? p.name
  const [notice, setNotice] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const setCfg = (fieldId: string, value: string) => {
    if (!p.schema || !resolved) return
    const wanted = { ...resolved.state, [fieldId]: value }
    const next = normalize(p.schema, wanted)
    const changed = p.schema.fields.filter((f) => f.id !== fieldId && next[f.id] !== wanted[f.id]).map((f) => f.label.toLowerCase())
    setNotice(changed.length ? `Для совместимости автоматически изменено: ${changed.join(', ')}.` : null)
    void navigate({ search: (prev) => ({ ...prev, cfg: encodeCfg(next, p.schema!) || undefined }), replace: true, resetScroll: false })
  }
  const setQty = (n: number) => void navigate({ search: (prev) => ({ ...prev, qty: n > 1 ? n : undefined }), replace: true, resetScroll: false })

  const configSummary = Object.fromEntries((resolved?.summary ?? []).map((s) => [s.label, s.value]))
  const request = () => openPrice({ code, product: p.name, config: { ...configSummary, Количество: `${qty} шт.` } })

  const downloadSpec = () => {
    const lines = [
      `Спецификация: ${p.name}`, `Обозначение: ${code}`, `Количество: ${qty} шт.`,
      ...(hasPrice ? [`Цена за единицу: ${rub(unit)}`, `Итого: ${rub(total)}`] : []),
      '', 'Выбранная конфигурация:', ...(resolved?.summary ?? []).map((s) => `- ${s.label}: ${s.value}`), '', 'Характеристики:', 
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `${p.id}.txt` })
    a.click(); URL.revokeObjectURL(url)
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* буфер недоступен */ }
  }

  const scope = SCOPE_BY_CATEGORY[p.category]
  const relatedDocs = scope ? documents.filter((d) => d.scope === scope && d.kind !== 'diploma').slice(0, 8) : []
  const reviews = useQuery(q.reviews())
  const similar = useQuery(q.similar(p))

  return (
    <>
      <div className="bg-brand-900 grid-bg"><div className="container-page py-5"><Breadcrumbs items={[{ label: 'Каталог', link: { to: '/catalog' } }, { label: cat.name, link: { to: '/catalog/$category', params: { category: cat.id } } }, { label: p.name }]} /></div></div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="grid place-items-center overflow-hidden rounded-md border border-ink-200 bg-white p-3">
            {p.images[image] ? <motion.img key={p.images[image]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t('fast')} src={p.images[image]} alt={p.name} className="max-h-96 w-full object-contain" /> : <ProductImage p={p} className="w-full" />}
          </div>
          {p.images.length > 1 && (
            <ul className="flex flex-wrap gap-2" aria-label="Изображения">
              {p.images.map((src, i) => (
                <li key={src}><button type="button" aria-label={`Изображение ${i + 1}`} aria-pressed={i === image} onClick={() => setImage(i)} className={cn('block size-16 overflow-hidden rounded-sm border bg-white p-1', i === image ? 'border-accent-500' : 'border-ink-200 hover:border-brand-300')}><img src={src} alt="" className="size-full object-contain" /></button></li>
              ))}
            </ul>
          )}
          {resolved && (
            <div className="rounded-md bg-ink-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">Обозначение для заказа</p>
              <OrderCode code={resolved.code} />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">{p.sub && <Badge tone="brand">{p.sub.name}</Badge>}<Badge>{cat.name}</Badge></div>
          <h1 className="mt-3 text-3xl">{p.name}</h1>
          <p className="mt-2 text-ink-600">{p.short}</p>

          {p.schema && resolved && (
            <section aria-labelledby="cfg-title" className="mt-8">
              <h2 id="cfg-title" className="mb-4 text-xl">Выбор модификации</h2>
              <Configurator schema={p.schema} resolved={resolved} onChange={setCfg} notice={notice} />
            </section>
          )}
          <div className="mt-4 grid max-w-xs gap-1.5">
            <label htmlFor="qty" className="text-sm font-medium text-brand-900">Количество, шт.</label>
            <Input id="qty" type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(9999, Number(e.target.value) || 1)))} />
          </div>

          <Card className="mt-6 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              {hasPrice ? (
                <div>
                  <p className="text-sm text-ink-500">Итого за {qty} шт.{discount > 0 && ` (скидка ${Math.round(discount * 100)} %)`}</p>
                  <motion.p key={total} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={t('fast')} className="font-mono text-3xl font-medium text-brand-900" aria-live="polite">{rub(total)}</motion.p>
                  <p className="text-sm text-ink-500">{rub(unit)} за единицу</p>
                </div>
              ) : (
                <div><p className="font-semibold text-brand-900">Цена по запросу</p><p className="text-sm text-ink-500">Подготовим предложение{p.schema ? ' по выбранной конфигурации' : ''}</p></div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="lg" onClick={request}>{hasPrice ? <Send className="size-4" aria-hidden /> : null}{hasPrice ? 'В запрос' : 'Запросить цену'}</Button>
                <Button size="lg" variant="outline" onClick={downloadSpec}><Download className="size-4" aria-hidden />Спецификация</Button>
                <Button size="lg" variant="ghost" onClick={copy}>{copied ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? 'Скопировано' : 'Поделиться'}</Button>
              </div>
            </div>
          </Card>

          {resolved && (
            <section aria-labelledby="sum-title" className="mt-8">
              <h2 id="sum-title" className="mb-3 text-xl">Итоговая конфигурация</h2>
              <SpecTable caption="Выбранные параметры" rows={[{ param: 'Обозначение', value: resolved.code }, ...resolved.summary.map((s) => ({ param: s.label, value: s.value })), { param: 'Количество', value: `${qty} шт.` }]} />
            </section>
          )}
        </div>
      </div>

      <div className="container-page pb-6">
        <Tabs
          value={search.tab ?? 'description'}
          onChange={(v) => void navigate({ search: (prev) => ({ ...prev, tab: v === 'description' ? undefined : (v as (typeof tabs)[number]) }), replace: true, resetScroll: false })}
          items={[
            { value: 'description', label: 'Описание', content: (
              <div className="space-y-6">
                <p className="max-w-3xl leading-relaxed text-ink-800">{p.content.summary}</p>
                {p.content.standard && <p className="font-mono text-sm text-ink-500">{p.content.standard}</p>}
                {p.content.applications.length > 0 && <Block title="Области применения" items={p.content.applications} />}
                {p.content.advantages.length > 0 && <Block title="Особенности" items={p.content.advantages} />}
                <Accordion items={[{ id: 'legacy', title: 'Полное исходное описание', content: <p className="whitespace-pre-line text-sm leading-relaxed">{p.legacyText}</p> }]} />
              </div>
            ) },
            { value: 'specs', label: 'Характеристики', content: <PerPage p={p} render={(pg) => pg.specGroups.length ? <div className="space-y-6">{pg.specGroups.map((g, i) => <div key={i}>{pg.specGroups.length > 1 && <h3 className="mb-2 text-base">{g.title}</h3>}<Prose html={g.html} /></div>)}</div> : null} empty="Характеристики приведены в исходном описании." /> },
            { value: 'order', label: 'Схема заказа', content: <PerPage p={p} render={(pg) => (pg.orderHtml ? <Prose html={pg.orderHtml} /> : null)} empty="Для этого товара схема заказа в источнике не приведена." /> },
            { value: 'docs', label: 'Документация', content: (
              [...p.documents.map((d) => ({ key: d.url, title: d.title, meta: d.format, url: d.url })), ...relatedDocs.map((d) => ({ key: d.slug, title: d.title, meta: docKindLabels[d.kind], url: d.file.url }))].length ? (
                <ul className="divide-y divide-ink-200 rounded-md border border-ink-200">
                  {[...p.documents.map((d) => ({ key: d.url, title: d.title, meta: d.format, url: d.url })), ...relatedDocs.map((d) => ({ key: d.slug, title: d.title, meta: docKindLabels[d.kind], url: d.file.url }))].map((d) => (
                    <li key={d.key} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="flex items-center gap-3"><FileText className="size-5 shrink-0 text-accent-600" aria-hidden /><span><span className="block text-sm font-medium">{d.title}</span><span className="text-xs text-ink-500">{d.meta}</span></span></span>
                      <a href={d.url} target="_blank" rel="noreferrer" download aria-label={`Скачать ${d.title}`} className={buttonClass('outline', 'sm')}><Download className="size-4" aria-hidden /></a>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-ink-600">Документов для этого товара нет. <Link to="/docs" className="text-brand-700 underline">Вся документация</Link></p>
            ) },
            { value: 'reviews', label: 'Отзывы', content: (
              <Async query={reviews} skeleton={<div className="h-32 animate-pulse rounded-md bg-ink-100" />} isEmpty={(d) => d.length === 0}>
                {(all) => <div className="grid items-start gap-5 md:grid-cols-2">{all.slice(0, 2).map((r) => <ReviewCard key={r.id} r={r} />)}</div>}
              </Async>
            ) },
          ]}
        />
      </div>

      <section className="bg-ink-50"><div className="container-page section">
        <SectionHead title="Похожие товары" />
        <Async query={similar} skeleton={<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <ProductCardSkeleton key={i} />)}</div>} isEmpty={(d) => d.length === 0} empty={<p className="text-sm text-ink-600">Похожих товаров нет.</p>}>
          {(list) => <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((s) => <ProductCard key={s.id} p={s} />)}</div>}
        </Async>
      </div></section>
    </>
  )
}

function Block({ title, items }: { title: string; items: string[] }) {
  const head = items.slice(0, 4)
  const more = items.slice(4)
  return (
    <section>
      <h3 className="mb-2 text-lg">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 marker:text-accent-500">{head.map((i) => <li key={i} className="text-sm">{i}</li>)}</ul>
      {more.length > 0 && <div className="mt-2"><Accordion items={[{ id: title, title: `Показать ещё (${more.length})`, content: <ul className="list-disc space-y-1 pl-5">{more.map((i) => <li key={i}>{i}</li>)}</ul> }]} /></div>}
    </section>
  )
}

/** Контент по страницам-источникам: у семейства из нескольких страниц — сворачиваемые блоки. */
function PerPage({ p, render, empty }: { p: Product; render: (pg: Product['content']['pages'][number]) => ReactNode; empty: string }) {
  const parts = p.content.pages.map((pg) => ({ pg, node: render(pg) })).filter((x) => x.node)
  if (!parts.length) return <p className="text-sm text-ink-600">{empty}</p>
  if (parts.length === 1) return <>{parts[0].node}</>
  return <Accordion items={parts.map(({ pg, node }) => ({ id: pg.slug, title: pg.name, content: node }))} />
}
