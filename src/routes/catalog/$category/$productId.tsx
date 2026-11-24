import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight, Copy, Download, FileText, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { q } from '@/api/queries'
import { PRICE_MODE } from '@/config'
import { decodeCfg, encodeCfg, normalize, qtyDiscount, resolve } from '@/configurator/engine'
import { useCategories } from '@/api/useCategories'
import { docKindLabels } from '@/data/labels'
import type { Product } from '@/data/types'
import { rub } from '@/lib/format'
import { openSpecSheet } from '@/lib/specSheet'
import { ProductCard, ProductCardSkeleton, ProductImage } from '@/components/catalog/ProductCard'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Configurator } from '@/components/product/Configurator'
import { Nameplate } from '@/components/product/Nameplate'
import { StickyRequest } from '@/components/product/StickyRequest'
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
import { SeoTag } from '@/components/SeoTag'
import { cn } from '@/lib/cn'

const tabs = ['description', 'specs', 'order', 'docs', 'reviews'] as const

export const Route = createFileRoute('/catalog/$category/$productId')({
  validateSearch: z.object({
    cfg: z.string().optional().catch(undefined),
    qty: z.number().int().min(1).max(9999).optional().catch(undefined),
    tab: z.enum(tabs).optional().catch(undefined),
  }),
  component: ProductPage,
})

function ProductPage() {
  const { productId, category } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { openPrice } = useModals()
  const query = useQuery(q.product(productId))
  return (
    <Async query={query} skeleton={<div className="container-page py-10"><div className="h-96 animate-pulse rounded-md bg-ink-100" /></div>}>
      {(p) => {
        if (!p || p.category !== category) throw notFound()
        return <ProductView key={p.id} p={p} search={search} navigate={navigate} openPrice={openPrice} />
      }}
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
  const { categories } = useCategories()
  const cat = categories.find((c) => c.id === p.category) ?? { id: p.category, name: 'Каталог' }
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
  const ctaRef = useRef<HTMLDivElement>(null)

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

  const downloadSpec = () => openSpecSheet({ p, code, qty, config: resolved?.summary ?? [], price: hasPrice ? { unit: rub(unit), total: rub(total) } : undefined })
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* буфер недоступен */ }
  }

  const scope = SCOPE_BY_CATEGORY[p.category]
  const docs = useQuery(q.documents())
  const relatedDocs = scope ? (docs.data ?? []).filter((d) => d.scope === scope && d.kind !== 'diploma').slice(0, 8) : []
  const reviews = useQuery(q.reviews())
  const similar = useQuery(q.similar(p.id))

  return (
    <>
      <SeoTag title={`${p.name} — купить`} description={p.short} image={p.images[0]} jsonLd={[{ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.short, sku: p.id, image: p.images, brand: { '@type': 'Brand', name: 'ВАКУУММАШ-ЭЛЕКТРО' }, ...(p.price !== null ? { offers: { '@type': 'Offer', priceCurrency: 'RUB', price: p.price } } : {}) }]} />
      <div className="border-b border-ink-200 bg-ink-50"><div className="container-page py-4"><Breadcrumbs items={[{ label: 'Каталог', link: { to: '/catalog' } }, { label: cat.name, link: { to: '/catalog/$category', params: { category: cat.id } } }, { label: p.name }]} /></div></div>

      <StickyRequest anchor={ctaRef} image={p.images[0]} name={p.name} code={code} qty={qty} onRequest={request} />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="space-y-3 lg:sticky lg:top-32 lg:self-start">
          <div
            className="relative grid place-items-center overflow-hidden rounded-md border border-ink-200 bg-white p-3"
            onKeyDown={(e) => {
              if (p.images.length < 2) return
              if (e.key === 'ArrowLeft') setImage((i) => (i - 1 + p.images.length) % p.images.length)
              if (e.key === 'ArrowRight') setImage((i) => (i + 1) % p.images.length)
            }}
          >
            {p.images[image] ? <motion.img key={p.images[image]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t('fast')} src={p.images[image]} alt={p.name} className="max-h-64 w-full object-contain sm:max-h-96" /> : <ProductImage p={p} className="w-full" />}
            {p.images.length > 1 && (
              <>
                <button type="button" aria-label="Предыдущее изображение" onClick={() => setImage((i) => (i - 1 + p.images.length) % p.images.length)} className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center border border-ink-200 bg-white/90 text-brand-900 transition-colors hover:border-brand-900 hover:bg-brand-900 hover:text-white"><ChevronLeft className="size-5" aria-hidden /></button>
                <button type="button" aria-label="Следующее изображение" onClick={() => setImage((i) => (i + 1) % p.images.length)} className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center border border-ink-200 bg-white/90 text-brand-900 transition-colors hover:border-brand-900 hover:bg-brand-900 hover:text-white"><ChevronRight className="size-5" aria-hidden /></button>
                <span className="absolute right-3 bottom-2 font-mono text-sm text-ink-500" aria-live="polite">{image + 1} / {p.images.length}</span>
              </>
            )}
          </div>
          {p.images.length > 1 && (
            <ul className="flex flex-wrap gap-2" aria-label="Изображения">
              {p.images.map((src, i) => (
                <li key={src}><button type="button" aria-label={`Изображение ${i + 1}`} aria-pressed={i === image} onClick={() => setImage(i)} className={cn('block size-16 overflow-hidden rounded-sm border bg-white p-1', i === image ? 'border-brand-900' : 'border-ink-200 hover:border-brand-300')}><img src={src} alt="" className="size-full object-contain" /></button></li>
              ))}
            </ul>
          )}
          {resolved && (
            <Nameplate code={resolved.code} />
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

          <div ref={ctaRef}><Card className="mt-6 p-5">
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
                <Button size="lg" variant="outline" onClick={downloadSpec}><Download className="size-4" aria-hidden />Спецификация PDF</Button>
                <Button size="lg" variant="ghost" onClick={() => { void navigate({ search: (prev) => ({ ...prev, tab: 'docs' }), replace: true, resetScroll: false }); setTimeout(() => document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' }), 50) }}>Документы и сертификаты</Button>
                <Button size="lg" variant="ghost" onClick={copy}>{copied ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? 'Скопировано' : 'Поделиться'}</Button>
              </div>
            </div>
          </Card></div>

          {resolved && (
            <details className="group mt-8 border-t border-ink-200 pt-4">
              <summary className="cursor-pointer font-display text-xl font-semibold text-brand-900">Все параметры выбранной конфигурации</summary>
              <div className="mt-3">
              <SpecTable caption="Выбранные параметры" rows={[{ param: 'Обозначение', value: resolved.code }, ...resolved.summary.map((s) => ({ param: s.label, value: s.value })), { param: 'Количество', value: `${qty} шт.` }]} />
              </div>
            </details>
          )}
        </div>
      </div>

      <div id="product-tabs" className="container-page scroll-mt-32 pb-6">
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
              </div>
            ) },
            { value: 'specs', label: 'Характеристики', content: <PerPage p={p} render={(pg) => pg.specGroups.length ? <div className="space-y-6">{pg.specGroups.map((g, i) => <div key={i}>{pg.specGroups.length > 1 && <h3 className="mb-2 text-base">{g.title}</h3>}<Prose html={g.html} /></div>)}</div> : null} empty="Характеристики приведены в исходном описании." /> },
            ...(p.schema && p.schema.fields.length >= 4 ? [] : [
              { value: 'order', label: 'Схема заказа', content: <PerPage p={p} render={(pg) => (pg.orderHtml ? <Prose html={pg.orderHtml} /> : null)} empty="Для этого товара схема заказа в источнике не приведена." /> }
            ]),
            { value: 'docs', label: 'Документация', content: (
              [...p.documents.map((d) => ({ key: d.url, title: d.title, meta: d.format, url: d.url })), ...relatedDocs.map((d) => ({ key: d.slug, title: d.title, meta: docKindLabels[d.kind], url: d.file.url }))].length ? (
                <ul className="divide-y divide-ink-200 rounded-md border border-ink-200">
                  {[...p.documents.map((d) => ({ key: d.url, title: d.title, meta: d.format, url: d.url })), ...relatedDocs.map((d) => ({ key: d.slug, title: d.title, meta: docKindLabels[d.kind], url: d.file.url }))].map((d) => (
                    <li key={d.key} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="flex items-center gap-3"><FileText className="size-5 shrink-0 text-brand-900" aria-hidden /><span><span className="block text-sm font-medium">{d.title}</span><span className="text-xs text-ink-500">{d.meta}</span></span></span>
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
      <ul className="list-disc space-y-1 pl-5 marker:text-brand-900">{head.map((i) => <li key={i} className="text-sm">{i}</li>)}</ul>
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
