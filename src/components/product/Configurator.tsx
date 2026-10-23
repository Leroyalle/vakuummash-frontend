import { Info, Lock } from 'lucide-react'
import type { ConfigSchema, ConfigState, Resolved } from '@/configurator/types'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'

type Props = {
  schema: ConfigSchema
  resolved: Resolved
  onChange: (fieldId: string, value: string) => void
  notice?: string | null
}

export function Configurator({ schema, resolved, onChange, notice }: Props) {
  const state: ConfigState = resolved.state
  return (
    <div>
      {notice && (
        <p key={notice} role="status" className="animate-shake mb-4 flex gap-2 rounded-sm border border-accent-500/30 bg-accent-500/10 px-3 py-2 text-sm text-accent-700">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />{notice}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {schema.fields.map((f) => {
          const blocked = resolved.disabled[f.id] ?? {}
          const reasons = Object.entries(blocked)
          const id = `cfg-${f.id}`
          return (
            <div key={f.id} className="min-w-0">
              <Field label={f.label} htmlFor={id} hint={f.hint}>
                <Select
                  id={id}
                  value={state[f.id]}
                  onChange={(v) => onChange(f.id, v)}
                  options={f.options.map((o) => ({ value: o.value, label: o.label, disabled: !!blocked[o.value], reason: blocked[o.value] }))}
                />
              </Field>
              {reasons.length > 0 && (
                <p className="mt-1.5 flex animate-fade-in gap-1.5 text-xs text-ink-500">
                  <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
                  <span>Недоступно: {[...new Set(reasons.map(([, r]) => r))][0]}</span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
