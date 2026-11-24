import { COMPANY } from '@/config'
import { useModals } from '@/components/forms/ModalsContext'

/** На телефоне главные действия всегда под большим пальцем; на десктопе они уже в шапке. */
export function FloatingContact() {
  const { openPrice } = useModals()
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-ink-200 bg-white md:hidden">
      <a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`} className="grid h-14 place-items-center font-display text-lg font-semibold text-brand-900">Позвонить</a>
      <button type="button" onClick={() => openPrice()} className="h-14 bg-cta font-display text-lg font-bold text-white">Запросить цену</button>
    </div>
  )
}
