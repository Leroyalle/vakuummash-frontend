export type ConfigOption = {
  value: string
  label: string
  /** фрагмент артикула */
  codePart: string
  /** надбавка к цене, ₽ */
  priceDelta?: number
  /** вклад в таблицу характеристик: «параметр → значение» */
  spec?: Record<string, string>
}

export type ConfigField = {
  id: string
  label: string
  options: ConfigOption[]
  default: string
  hint?: string
}

/** Правило совместимости: если выбрано `when`, значения `disable` блокируются. */
export type ConfigRule = {
  when: { field: string; in: string[] }
  disable: { field: string; values: string[] }
  reason: string
}

export type ConfigSchema = {
  fields: ConfigField[]
  rules: ConfigRule[]
  /** Шаблон артикула, например "ДД-{type}-{range}-{signal}" */
  codeTemplate: string
  basePrice: number
}

export type ConfigState = Record<string, string>

export type Resolved = {
  state: ConfigState
  code: string
  price: number
  /** field → value → причина блокировки */
  disabled: Record<string, Record<string, string>>
  specs: { param: string; value: string }[]
  summary: { field: string; label: string; value: string }[]
}
