import { useForm } from '@tanstack/react-form'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'

export type LeadField = 'name' | 'company' | 'phone' | 'email' | 'comment'

type Values = Record<LeadField, string>

const phoneRe = /^[+\d][\d\s()-]{9,}$/

const rules = {
  name: z.string().trim().min(2, 'Укажите имя (от 2 символов)'),
  company: z.string().trim().min(2, 'Укажите название компании'),
  phone: z.string().trim().regex(phoneRe, 'Введите телефон в формате +7 (900) 000-00-00'),
  email: z.string().trim().email('Введите корректный e-mail'),
  comment: z.string().trim().max(1000, 'Не более 1000 символов'),
}

const labels: Record<LeadField, string> = {
  name: 'Имя', company: 'Компания', phone: 'Телефон', email: 'E-mail', comment: 'Комментарий',
}

type Props = {
  fields: LeadField[]
  /** обязательные поля; остальные — опциональны */
  required?: LeadField[]
  submitLabel: string
  successTitle: string
  successText?: string
  /** дополнительные данные (например, конфигурация) — отправляются вместе с формой */
  extra?: Record<string, string>
  commentLabel?: string
  onDone?: () => void
}

export function LeadForm({ fields, required = fields.filter((f) => f !== 'comment'), submitLabel, successTitle, successText, extra, commentLabel, onDone }: Props) {
  const [sent, setSent] = useState(false)

  const shape = Object.fromEntries(
    fields.map((f) => [f, required.includes(f) ? rules[f] : f === 'comment' ? rules.comment : rules[f].or(z.literal(''))]),
  )
  const schema = z.object(shape) as unknown as z.ZodType<Values, Values>

  const form = useForm({
    defaultValues: Object.fromEntries(fields.map((f) => [f, ''])) as Values,
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 600)) // имитация отправки
      setSent(true)
    },
  })

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center py-6 text-center">
        <CheckCircle2 className="mb-3 size-12 text-ok" aria-hidden />
        <p className="text-lg font-semibold text-brand-900">{successTitle}</p>
        <p className="mt-1 text-sm text-ink-600">{successText ?? 'Менеджер свяжется с вами в течение одного рабочего дня.'}</p>
        {onDone && <Button className="mt-5" variant="outline" onClick={onDone}>Закрыть</Button>}
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); void form.handleSubmit() }}
      className="space-y-4"
    >
      {extra && (
        <dl className="rounded-sm border border-ink-200 bg-ink-50 p-3 text-xs">
          {Object.entries(extra).map(([k, v]) => (
            <div key={k} className="flex gap-2 py-0.5"><dt className="w-28 shrink-0 text-ink-500">{k}</dt><dd className={k === 'Артикул' ? 'font-mono font-medium text-brand-900' : 'text-ink-800'}>{v}</dd></div>
          ))}
        </dl>
      )}
      {fields.map((name) => (
        <form.Field key={name} name={name}>
          {(field) => {
            const id = `lead-${name}-${field.name}`
            const err = field.state.meta.isTouched || form.state.submissionAttempts > 0
              ? (field.state.meta.errors as unknown[]).map((e) => (typeof e === 'string' ? e : (e as { message?: string } | undefined)?.message)).filter(Boolean)[0]
              : undefined
            const label = `${name === 'comment' && commentLabel ? commentLabel : labels[name]}${required.includes(name) ? '' : ' (необязательно)'}`
            return (
              <Field label={label} htmlFor={id} error={err}>
                {name === 'comment' ? (
                  <Textarea id={id} name={name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} aria-invalid={!!err} />
                ) : (
                  <Input
                    id={id} name={name} value={field.state.value}
                    type={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'}
                    autoComplete={name === 'phone' ? 'tel' : name === 'email' ? 'email' : name === 'name' ? 'name' : name === 'company' ? 'organization' : 'off'}
                    onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined}
                  />
                )}
              </Field>
            )
          }}
        </form.Field>
      ))}
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(busy) => <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Отправка…' : submitLabel}</Button>}
      </form.Subscribe>
      <p className="text-xs text-ink-500">Нажимая кнопку, вы соглашаетесь на обработку персональных данных. Это демонстрационный макет — данные никуда не отправляются.</p>
    </form>
  )
}
