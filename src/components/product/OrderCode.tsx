import { useState } from 'react'

/** Код заказа: изменившиеся сегменты коротко подсвечиваются оранжевым и затухают. */
export function OrderCode({ code }: { code: string }) {
  const [state, setState] = useState({ code, prev: code })
  if (state.code !== code) setState({ code, prev: state.code })
  const prev = state.prev.split('-')
  const parts = code.split('-')
  return (
    <p className="mt-1 break-words font-mono text-sm font-medium text-brand-900" data-testid="order-code">
      {parts.map((tok, i) => (
        <span key={`${i}:${tok}`}>
          {i > 0 && '-'}
          <span className={prev[i] !== tok && state.code !== state.prev ? 'animate-flash rounded-sm' : undefined}>{tok}</span>
        </span>
      ))}
    </p>
  )
}
