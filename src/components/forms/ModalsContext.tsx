import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { LeadForm } from './LeadForm'

type PriceCtx = { code?: string; product?: string; config?: Record<string, string> }
type Ctx = { openCallback: () => void; openPrice: (c?: PriceCtx) => void }

const C = createContext<Ctx | null>(null)
export const useModals = () => {
  const v = useContext(C)
  if (!v) throw new Error('useModals outside provider')
  return v
}

export function ModalsProvider({ children }: { children: ReactNode }) {
  const [callback, setCallback] = useState(false)
  const [price, setPrice] = useState<PriceCtx | null>(null)
  // после отправки подсказку над формой убираем: на экране остаётся только «Запрос отправлен»
  const [sent, setSent] = useState(false)
  const openCallback = useCallback(() => { setSent(false); setCallback(true) }, [])
  const openPrice = useCallback((c?: PriceCtx) => { setSent(false); setPrice(c ?? {}) }, [])
  const value = useMemo(() => ({ openCallback, openPrice }), [openCallback, openPrice])

  // с конфигуратора приходит товар и артикул, со слайдера — только товар, из шапки — ничего: тогда просим описать задачу
  const extra = price?.code
    ? { 'Товар': price.product ?? '', 'Артикул': price.code, ...price.config }
    : price?.product ? { 'Товар': price.product } : undefined
  const general = !price?.product
  const priceDescription = price?.code
    ? `${price.product}, ${price.code}. Подготовим коммерческое предложение по этой модификации.`
    : price?.product
      ? `${price.product}. Укажите в комментарии диапазон, сигнал и количество, если знаете, — или подберём сами.`
      : 'Напишите, какие приборы нужны, — подберём модификации и пришлём коммерческое предложение.'

  return (
    <C.Provider value={value}>
      {children}
      <Modal open={callback} onOpenChange={setCallback} title="Заказать звонок" description={sent ? undefined : 'Оставьте номер — перезвоним в рабочее время.'}>
        <LeadForm onSent={() => setSent(true)} kind="callback" fields={['name', 'phone']} submitLabel="Жду звонка" successTitle="Заявка принята" onDone={() => setCallback(false)} />
      </Modal>
      <Modal open={!!price} onOpenChange={(o) => !o && setPrice(null)} title={general ? 'Запрос на подбор и цену' : 'Запросить цену'} description={sent ? undefined : priceDescription}>
        {price && (
          <LeadForm
            onSent={() => setSent(true)}
            kind={general ? 'selection' : 'price'}
            fields={['name', 'company', 'phone', 'email', 'comment']}
            required={general ? ['name', 'company', 'phone', 'email', 'comment'] : ['name', 'company', 'phone', 'email']}
            commentLabel={general ? 'Что нужно' : 'Комментарий'}
            commentPlaceholder={general ? 'Например: датчик давления 0–1,6 МПа, 4–20 мА, взрывозащита Ex d, 10 шт. Или обозначение со старого заказа.' : undefined}
            submitLabel="Отправить запрос"
            successTitle="Запрос отправлен"
            successText="Пришлём коммерческое предложение на указанный e-mail."
            extra={extra}
            onDone={() => setPrice(null)}
          />
        )}
      </Modal>
    </C.Provider>
  )
}
