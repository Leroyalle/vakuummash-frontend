import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useConfirm } from './kit'
import { useState } from 'react'
import { Prose } from '@/components/ui/Prose'
import { BlocksEditor } from './BlocksEditor'
import { RichText } from './RichText'
import { parseSpecList, SpecRowsEditor, specListToHtml } from './SpecRowsEditor'

export type SpecGroup = { title: string; html: string }
export type ContentPage = { slug: string; name: string; specGroups: SpecGroup[]; orderHtml: string; rest: string }
export type FamilyContent = { summary?: string; standard?: string | null; applications?: string[]; advantages?: string[]; pages?: ContentPage[] }

const move = <T,>(arr: T[], i: number, d: -1 | 1) => {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

function StringList({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-brand-900">{label}</p>
      <div className="space-y-2">
        {items.map((x, i) => (
          <div key={i} className="flex gap-2">
            <Input aria-label={`${label}: пункт ${i + 1}`} placeholder={placeholder} value={x} onChange={(e) => onChange(items.map((y, j) => (j === i ? e.target.value : y)))} />
            <Button variant="ghost" aria-label="Убрать пункт" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="size-4 text-danger" aria-hidden /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onChange([...items, ''])}><Plus className="size-4" aria-hidden />Добавить пункт</Button>
      </div>
    </div>
  )
}

/** Один блок характеристик: список «параметр — значение», сложная справочная таблица или текст. */
function SpecGroupEditor({ id, html, onChange, chosenLabels }: { id: string; html: string; onChange: (html: string) => void; chosenLabels: string[] }) {
  const [expert, setExpert] = useState(false)
  const list = parseSpecList(html)
  if (list) return <SpecRowsEditor list={list} chosenLabels={chosenLabels} onChange={(l) => onChange(specListToHtml(l))} />
  if (!/<table/i.test(html)) return <RichText id={id} label="Текст" value={html} onChange={onChange} minHeight={120} />
  return (
    <div className="space-y-3">
      <p className="text-[0.9375rem] text-ink-600">Это справочная таблица из каталога (несколько столбцов, объединённые ячейки). Обычно её не правят: она показывается на сайте как есть.</p>
      {expert ? <BlocksEditor id={id} label="Таблица" value={html} onChange={onChange} /> : (
        <div className="max-h-80 overflow-auto border border-ink-200 bg-white p-3"><Prose html={html} className="text-sm" /></div>
      )}
      <Button variant="ghost" size="sm" onClick={() => setExpert(!expert)}>{expert ? 'Свернуть редактор' : 'Изменить таблицу (для специалиста)'}</Button>
    </div>
  )
}

/** Контент страницы товара: обычные поля и простые редакторы вместо HTML. */
export function ContentEditor({ value, onChange, autoOrder, chosenLabels = [] }: { value: FamilyContent; onChange: (v: FamilyContent) => void; /** схема заказа собирается автоматически из «Выбора модификации» */ autoOrder?: boolean; /** параметры выбора модификации — чтобы подсветить повторы в характеристиках */ chosenLabels?: string[] }) {
  const confirm = useConfirm()
  const pages = value.pages ?? []
  const setPage = (i: number, patch: Partial<ContentPage>) => onChange({ ...value, pages: pages.map((p, j) => (j === i ? { ...p, ...patch } : p)) })
  const several = pages.length > 1

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <h3 className="text-xl font-semibold text-brand-900">О товаре</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <StringList label="Где применяется" placeholder="Например: нефтегазовая отрасль" items={value.applications ?? []} onChange={(applications) => onChange({ ...value, applications })} />
          <StringList label="Особенности и преимущества" placeholder="Например: межповерочный интервал 5 лет" items={value.advantages ?? []} onChange={(advantages) => onChange({ ...value, advantages })} />
        </div>
        <Field label="Стандарт или ТУ (необязательно)" htmlFor="c-standard" hint="Например: ТУ 26.51.52-001-12345678-2020"><Input id="c-standard" value={value.standard ?? ''} onChange={(e) => onChange({ ...value, standard: e.target.value || null })} /></Field>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-brand-900">Технические характеристики</h3>
        <p className="mb-4 mt-1 text-[0.9375rem] text-ink-600">Показываются на вкладке «Характеристики». Пишите построчно: параметр слева, значение справа. То, что клиент выбирает сам (модель, диапазон, сигнал), сюда дублировать не нужно.{several && ' У товара несколько исполнений: у каждого свой блок.'}</p>
        <div className="space-y-5">
          {pages.map((pg, i) => (
            <div key={i} className="border border-ink-200 bg-white">
              <div className="flex flex-wrap items-end gap-2 border-b border-ink-100 bg-ink-50 px-4 py-3">
                <div className="min-w-64 flex-1"><Field label={several ? `Исполнение ${i + 1}` : 'Название блока'} htmlFor={`pg-name-${i}`}><Input id={`pg-name-${i}`} value={pg.name} onChange={(e) => setPage(i, { name: e.target.value })} placeholder="Например: Общепромышленное исполнение" /></Field></div>
                {several && <Button variant="ghost" aria-label="Выше" onClick={() => onChange({ ...value, pages: move(pages, i, -1) })}><ArrowUp className="size-4" aria-hidden /></Button>}
                {several && <Button variant="ghost" aria-label="Ниже" onClick={() => onChange({ ...value, pages: move(pages, i, 1) })}><ArrowDown className="size-4" aria-hidden /></Button>}
                <Button variant="ghost" className="text-danger hover:bg-danger/10" onClick={async () => { if (await confirm({ title: `Удалить «${pg.name || 'блок'}»?`, text: 'Все характеристики и примечания этого блока будут удалены после сохранения товара.' })) onChange({ ...value, pages: pages.filter((_, j) => j !== i) }) }}>Удалить</Button>
              </div>
              <div className="space-y-6 p-4">
                {pg.specGroups.map((g, k) => (
                  <div key={k} className="space-y-3">
                    {pg.specGroups.length > 1 && (
                      <div className="flex items-end gap-2">
                        <div className="flex-1"><Field label="Заголовок таблицы" htmlFor={`sg-t-${i}-${k}`}><Input id={`sg-t-${i}-${k}`} value={g.title} onChange={(e) => setPage(i, { specGroups: pg.specGroups.map((x, j) => (j === k ? { ...x, title: e.target.value } : x)) })} /></Field></div>
                        <Button variant="ghost" className="text-danger hover:bg-danger/10" onClick={async () => { if (await confirm({ title: 'Удалить эту таблицу?', text: 'Она исчезнет со страницы товара после сохранения.' })) setPage(i, { specGroups: pg.specGroups.filter((_, j) => j !== k) }) }}>Удалить таблицу</Button>
                      </div>
                    )}
                    <SpecGroupEditor id={`sg-h-${i}-${k}`} html={g.html} chosenLabels={chosenLabels} onChange={(html) => setPage(i, { specGroups: pg.specGroups.map((x, j) => (j === k ? { ...x, html } : x)) })} />
                  </div>
                ))}
                {pg.specGroups.length === 0 && <p className="text-[0.9375rem] text-ink-500">Характеристик пока нет.</p>}
                <Button variant="outline" size="sm" onClick={() => setPage(i, { specGroups: [...pg.specGroups, { title: 'Характеристики', html: specListToHtml({ header: ['Параметр', 'Значение'], items: [{ kind: 'row', name: '', value: '' }] }) }] })}><Plus className="size-4" aria-hidden />{pg.specGroups.length ? 'Ещё одна таблица' : 'Добавить характеристики'}</Button>

                {!autoOrder && (pg.orderHtml || !several) && <BlocksEditor id={`pg-order-${i}`} label="Как составить обозначение при заказе" value={pg.orderHtml} onChange={(orderHtml) => setPage(i, { orderHtml })} />}
                <RichText id={`pg-rest-${i}`} label="Примечания (необязательно)" value={pg.rest} onChange={(rest) => setPage(i, { rest })} minHeight={80} />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={() => onChange({ ...value, pages: [...pages, { slug: `section-${pages.length + 1}`, name: '', specGroups: [], orderHtml: '', rest: '' }] })}><Plus className="size-4" aria-hidden />{pages.length ? 'Добавить исполнение' : 'Добавить характеристики'}</Button>
          {autoOrder && <p className="text-sm text-ink-500">Обозначение при заказе собирается автоматически на вкладке «Выбор модификации», отдельная схема заказа не нужна.</p>}
        </div>
      </section>
    </div>
  )
}
