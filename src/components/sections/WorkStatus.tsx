import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

/** Часы работы завода по местному времени Сарапула (UTC+4), со страницы «Контакты» vmelectro.ru. Ключ — день недели, 1 = пн. */
const SCHEDULE: Record<number, [number, number] | undefined> = { 1: [7, 18], 2: [7, 18], 3: [7, 18], 4: [7, 18], 5: [9, 17] }
const DAY = ['', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу', 'в воскресенье']
const TZ = 'Europe/Samara'

function now() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((p) => [p.type, p.value]))
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday) + 1
  return { day, h: Number(parts.hour), m: Number(parts.minute), time: `${parts.hour}:${parts.minute}` }
}

function status() {
  const t = now()
  const today = SCHEDULE[t.day]
  const mins = t.h * 60 + t.m
  if (today && mins >= today[0] * 60 && mins < today[1] * 60) return { open: true, text: `Сейчас работаем, до ${today[1]}:00`, time: t.time }
  // ближайшее открытие: сегодня позже или в следующий рабочий день
  if (today && mins < today[0] * 60) return { open: false, text: `Откроемся сегодня в ${String(today[0]).padStart(2, '0')}:00`, time: t.time }
  for (let k = 1; k <= 7; k++) {
    const d = ((t.day - 1 + k) % 7) + 1
    const s = SCHEDULE[d]
    if (s) return { open: false, text: `Откроемся ${k === 1 ? 'завтра' : DAY[d]} в ${String(s[0]).padStart(2, '0')}:00`, time: t.time }
  }
  return { open: false, text: '', time: t.time }
}

/** Живой статус «работаем / закрыто» по часам завода. Обновляется раз в минуту. */
export function WorkStatus({ className }: { className?: string }) {
  const [s, setS] = useState(status)
  useEffect(() => {
    const id = setInterval(() => setS(status()), 60_000)
    return () => clearInterval(id)
  }, [])
  return (
    <p className={cn('inline-flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <span className="inline-flex items-center gap-2 font-medium">
        <span aria-hidden className="relative flex size-2.5">
          {s.open && <span className="absolute inset-0 animate-ping rounded-full bg-[#4ade80] opacity-75" />}
          <span className={cn('relative size-2.5 rounded-full', s.open ? 'bg-[#4ade80]' : 'bg-accent-500')} />
        </span>
        {s.text}
      </span>
      <span className="text-sm opacity-80">в Сарапуле {s.time}</span>
    </p>
  )
}
