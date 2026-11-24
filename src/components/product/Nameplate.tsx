import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { OrderCode } from './OrderCode'

/** Винт в углу таблички: головка со шлицем. */
const Screw = ({ className }: { className: string }) => (
  <span aria-hidden className={`absolute grid size-3 place-items-center rounded-full border border-ink-300 bg-white ${className}`}>
    <span className="h-px w-2 rotate-45 bg-ink-500" />
  </span>
)

/** Обозначение для заказа в виде заводской таблички прибора: шапка с маркой, знак логотипа, код и копирование. */
export function Nameplate({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* буфер недоступен */ }
  }
  return (
    <div className="border border-ink-300 bg-ink-100">
      <div className="flex items-center justify-between gap-3 bg-brand-500 px-4 py-1.5 text-xs font-semibold tracking-[0.08em] text-white uppercase">
        <span>ВакууммашЭлектро</span><span className="font-normal opacity-85">г. Сарапул</span>
      </div>
      <div className="relative px-6 pt-4 pb-3">
        <Screw className="top-2 left-2" /><Screw className="top-2 right-2" /><Screw className="bottom-2 left-2" /><Screw className="right-2 bottom-2" />
        <div className="flex items-start gap-4">
          <img src={`${import.meta.env.BASE_URL}brand/mark.png`} alt="" width={252} height={179} className="mt-1 h-9 w-auto shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-[0.06em] text-ink-600 uppercase">Обозначение для заказа</p>
            <OrderCode code={code} className="text-base text-brand-950" />
          </div>
        </div>
        <button type="button" onClick={copy} className="mt-2 ml-[3.25rem] inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900">
          {copied ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? 'Скопировано' : 'Скопировать обозначение'}
        </button>
      </div>
    </div>
  )
}
