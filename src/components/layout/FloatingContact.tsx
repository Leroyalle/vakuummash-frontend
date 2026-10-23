import { MessageCircle, Phone, Send, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { COMPANY } from '@/config'
import { useModals } from '@/components/forms/ModalsContext'

export function FloatingContact() {
  const [open, setOpen] = useState(false)
  const { openCallback } = useModals()
  const item = 'flex items-center gap-2 rounded-sm bg-white px-4 py-2.5 text-sm font-medium text-brand-900 shadow-md hover:text-accent-700'
  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 md:right-6 md:bottom-6">
      {open && (
        <div id="fab-menu" className="flex flex-col items-end gap-2">
          <a className={item} href={`tel:${COMPANY.phone.replace(/[^\d+]/g, '')}`}><Phone className="size-4" aria-hidden />{COMPANY.phone}</a>
          <button type="button" className={item} onClick={() => { setOpen(false); openCallback() }}><Send className="size-4" aria-hidden />Заказать звонок</button>
          <Link to="/support" className={item}><MessageCircle className="size-4" aria-hidden />Задать вопрос консультанту</Link>
        </div>
      )}
      <button
        type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="fab-menu"
        className="flex h-12 items-center gap-2 rounded-full bg-accent-500 px-5 font-medium text-white shadow-lg hover:bg-accent-600"
      >
        {open ? <X className="size-5" aria-hidden /> : <MessageCircle className="size-5" aria-hidden />}
        {open ? 'Закрыть' : 'Связаться'}
      </button>
    </div>
  )
}
