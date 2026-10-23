import type { ConfigSchema, ConfigState, Resolved } from './types'

export function defaultState(schema: ConfigSchema): ConfigState {
  return Object.fromEntries(schema.fields.map((f) => [f.id, f.default]))
}

function computeDisabled(schema: ConfigSchema, state: ConfigState) {
  const out: Resolved['disabled'] = {}
  for (const r of schema.rules) {
    if (!r.when.in.includes(state[r.when.field])) continue
    const bucket = (out[r.disable.field] ??= {})
    for (const v of r.disable.values) bucket[v] ??= r.reason
  }
  return out
}

/** Приводит состояние к допустимому: неизвестные и заблокированные значения заменяются. */
export function normalize(schema: ConfigSchema, input: ConfigState): ConfigState {
  let state: ConfigState = { ...defaultState(schema), ...input }
  for (let pass = 0; pass < 5; pass++) {
    const disabled = computeDisabled(schema, state)
    let changed = false
    for (const f of schema.fields) {
      const cur = state[f.id]
      const known = f.options.some((o) => o.value === cur)
      const blocked = !!disabled[f.id]?.[cur]
      if (known && !blocked) continue
      const def = f.options.find((o) => o.value === f.default && !disabled[f.id]?.[o.value])
      const first = def ?? f.options.find((o) => !disabled[f.id]?.[o.value]) ?? f.options[0]
      state = { ...state, [f.id]: first.value }
      changed = true
    }
    if (!changed) break
  }
  return state
}

export function resolve(schema: ConfigSchema, input: ConfigState): Resolved {
  const state = normalize(schema, input)
  const disabled = computeDisabled(schema, state)
  let price = schema.basePrice
  const specs: Resolved['specs'] = []
  const summary: Resolved['summary'] = []
  const parts: Record<string, string> = {}

  for (const f of schema.fields) {
    const o = f.options.find((x) => x.value === state[f.id])!
    price += o.priceDelta ?? 0
    parts[f.id] = o.codePart
    summary.push({ field: f.id, label: f.label, value: o.label })
    if (o.spec) for (const [param, value] of Object.entries(o.spec)) specs.push({ param, value })
  }
  const code = schema.codeTemplate
    .replace(/\{(\w+)\}/g, (_, id: string) => parts[id] ?? '')
    .replace(/-{2,}/g, '-')
    .replace(/-$/, '')
  return { state, code, price, disabled, specs, summary }
}

/** Скидка за количество */
export function qtyDiscount(qty: number) {
  if (qty >= 50) return 0.12
  if (qty >= 20) return 0.08
  if (qty >= 10) return 0.05
  return 0
}

// ---------- сериализация в URL: "type:g,range:r16" ----------
export function encodeCfg(state: ConfigState, schema: ConfigSchema): string {
  const def = defaultState(schema)
  return Object.entries(state)
    .filter(([k, v]) => def[k] !== v)
    .map(([k, v]) => `${k}:${v}`)
    .join(',')
}

export function decodeCfg(raw: string | undefined): ConfigState {
  if (!raw) return {}
  return Object.fromEntries(
    raw.split(',').map((p) => p.split(':')).filter((p) => p.length === 2 && p[0] && p[1]),
  )
}
