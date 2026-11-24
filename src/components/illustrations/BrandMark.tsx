import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

const pt = (cx: number, cy: number, rx: number, ry: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return `${(cx + rx * Math.cos(a)).toFixed(1)} ${(cy + ry * Math.sin(a)).toFixed(1)}`
}

// Знак логотипа крупно: оранжевый серп и ломаная «VM» поверх него.
const FROM = -150
const TO = 105
const OUTER = [540, 350, 420, 270] as const
const INNER = [556, 336, 398, 238] as const
const MID = [548, 343, 409, 254] as const
const CRESCENT = `M${pt(...OUTER, FROM)} A${OUTER[2]} ${OUTER[3]} 0 1 1 ${pt(...OUTER, TO)} L${pt(...INNER, TO)} A${INNER[2]} ${INNER[3]} 0 1 0 ${pt(...INNER, FROM)}Z`
const SPINE = `M${pt(...MID, FROM)} A${MID[2]} ${MID[3]} 0 1 1 ${pt(...MID, TO)}`
const ZIGZAG = 'M90 60 L330 520 L440 300 L520 450 L610 300 L800 690'

const ease = [0.16, 1, 0.3, 1] as const

/**
 * Фирменный знак-водяной знак для шапок страниц и тёмных блоков. Прорисовывается один раз.
 * `tone`: на синем фоне ломаная белая полупрозрачная, на светлом — синяя.
 */
export function BrandMark({ className, tone = 'onBlue', id }: { className?: string; tone?: 'onBlue' | 'onLight'; id: string }) {
  const still = useReducedMotion()
  const from = still ? 1 : 0
  return (
    <svg aria-hidden viewBox="0 0 1000 720" className={cn('pointer-events-none absolute', className)}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse">
          <motion.path d={SPINE} fill="none" stroke="white" strokeWidth="90" strokeLinecap="round"
            initial={{ pathLength: from }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.25, ease }} />
        </mask>
      </defs>
      <motion.path d={ZIGZAG} fill="none" strokeWidth="38" strokeLinejoin="miter" strokeLinecap="butt"
        className={tone === 'onBlue' ? 'stroke-white/15' : 'stroke-brand-500/15'}
        initial={{ pathLength: from }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease }} />
      <path d={CRESCENT} fill="var(--color-accent-500)" mask={`url(#${id})`} />
    </svg>
  )
}
