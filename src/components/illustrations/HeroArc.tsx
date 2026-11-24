import { motion, useReducedMotion } from 'motion/react'

/** Точка эллипса по углу в градусах (ось y вниз, как в SVG). */
const pt = (cx: number, cy: number, rx: number, ry: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return `${(cx + rx * Math.cos(a)).toFixed(1)} ${(cy + ry * Math.sin(a)).toFixed(1)}`
}

// Дуга-серп как в логотипе: открыта слева-снизу, толще справа и внизу.
const FROM = -118
const TO = 100
const OUTER = [560, 360, 430, 280] as const
const INNER = [578, 344, 408, 246] as const
const MID = [569, 352, 419, 263] as const
const CRESCENT = `M${pt(...OUTER, FROM)} A${OUTER[2]} ${OUTER[3]} 0 1 1 ${pt(...OUTER, TO)} L${pt(...INNER, TO)} A${INNER[2]} ${INNER[3]} 0 1 0 ${pt(...INNER, FROM)}Z`
const SPINE = `M${pt(...MID, FROM)} A${MID[2]} ${MID[3]} 0 1 1 ${pt(...MID, TO)}`

/** Фирменная оранжевая дуга логотипа на первом экране: прорисовывается один раз при загрузке. Декор. */
export function HeroArc() {
  const still = useReducedMotion()
  return (
    <svg aria-hidden viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute top-1/2 right-[-8%] hidden h-[118%] -translate-y-1/2 lg:block">
      <defs>
        <mask id="hero-arc-reveal" maskUnits="userSpaceOnUse">
          <motion.path
            d={SPINE} fill="none" stroke="white" strokeWidth="90" strokeLinecap="round"
            initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </mask>
      </defs>
      <path d={CRESCENT} fill="var(--color-accent-500)" mask="url(#hero-arc-reveal)" />
    </svg>
  )
}
