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
  const openCallback = useCallback(() => setCallback(true), [])
  const openPrice = useCallback((c?: PriceCtx) => setPrice(c ?? {}), [])
  const value = useMemo(() => ({ openCallback, openPrice }), [openCallback, openPrice])

  const extra = price?.code
    ? { 'Товар': price.product ?? '', 'Артикул': price.code, ...price.config }
    : undefined

  return (
    <C.Provider value={value}>
      {children}
      <Modal open={callback} onOpenChange={setCallback} title="Заказать звонок" description="Перезвоним в рабочее время в течение 15 минут.">
        <LeadForm fields={['name', 'phone']} submitLabel="Жду звонка" successTitle="Заявка принята" onDone={() => setCallback(false)} />
      </Modal>
      <Modal open={!!price} onOpenChange={(o) => !o && setPrice(null)} title="Запросить цену" description="Укажите контакты — подготовим коммерческое предложение по выбранной конфигурации.">
        {price && (
          <LeadForm
            fields={['name', 'company', 'phone', 'email', 'comment']}
            required={['name', 'company', 'phone', 'email']}
            submitLabel="Отправить запрос"
            successTitle="Запрос отправлен"
            successText="Коммерческое предложение придёт на e-mail в течение одного рабочего дня."
            extra={extra}
            onDone={() => setPrice(null)}
          />
        )}
      </Modal>
    </C.Provider>
  )
}
