import { motion, useReducedMotion } from 'motion/react'

// Шкала манометра 0…600 кПа на дуге 270°: 0 слева снизу, 600 справа снизу.
const MAX = 600
const C = 160
const R = 128
const angle = (v: number) => -225 + (270 * v) / MAX
const at = (v: number, r: number) => {
  const a = (angle(v) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const
}
const arc = (from: number, to: number, r: number) => {
  const [x1, y1] = at(from, r)
  const [x2, y2] = at(to, r)
  return `M${x1} ${y1} A${r} ${r} 0 ${(270 * (to - from)) / MAX > 180 ? 1 : 0} 1 ${x2} ${y2}`
}

/** Манометр для страницы 404: стрелка проскакивает и встаёт на «404». */
export function Gauge404({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  const target = angle(404) + 90 // стрелка нарисована вертикально вверх
  return (
    <svg viewBox="0 0 320 320" role="img" aria-label="Манометр показывает 404" className={className}>
      <circle cx={C} cy={C} r={152} className="fill-white stroke-brand-500" strokeWidth={8} />
      <circle cx={C} cy={C} r={140} className="fill-none stroke-brand-100" strokeWidth={2} />
      <path d={arc(500, 600, 116)} className="fill-none stroke-accent-500" strokeWidth={10} />
      {Array.from({ length: 25 }, (_, i) => i * 25).map((v) => {
        const major = v % 100 === 0
        const [x1, y1] = at(v, R)
        const [x2, y2] = at(v, major ? R - 16 : R - 8)
        return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-brand-900" strokeWidth={major ? 3 : 1.5} />
      })}
      {[0, 100, 200, 300, 400, 500, 600].map((v) => {
        const [x, y] = at(v, R - 34)
        return <text key={v} x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-brand-900 font-mono text-[15px]">{v}</text>
      })}
      <text x={C} y={C + 52} textAnchor="middle" className="fill-ink-500 font-mono text-[13px]">кПа</text>
      <text x={C} y={C + 92} textAnchor="middle" className="fill-brand-900 font-display text-[34px] font-bold">404</text>
      <motion.g
        style={{ transformBox: 'view-box', transformOrigin: `${C}px ${C}px` }}
        initial={{ rotate: reduce ? target : angle(0) + 90 }}
        animate={{ rotate: target }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 60, damping: 7, mass: 1.2, delay: 0.3 }}
      >
        <path d={`M${C - 5} ${C} L${C} ${C - 112} L${C + 5} ${C} Z`} className="fill-accent-500" />
      </motion.g>
      <circle cx={C} cy={C} r={11} className="fill-brand-900" />
      <circle cx={C} cy={C} r={4} className="fill-white" />
    </svg>
  )
}
