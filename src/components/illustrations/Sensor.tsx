import type { CategoryId } from '@/data/types'

type Props = {
  category: CategoryId
  /** состояние конфигуратора — влияет на отрисовку */
  state?: Record<string, string>
  label?: string
  className?: string
}

const STROKE = '#0B2A55'
const FILL = '#EAF0F7'
const ACCENT = '#F26A1B'

/** Чертёжное SVG-превью датчика. Реагирует на выбранные опции. */
export function Sensor({ category, state = {}, label, className }: Props) {
  return (
    <svg viewBox="0 0 320 240" className={className} role="img" aria-label={label ?? 'Схема датчика'}>
      <defs>
        <pattern id="bp" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="#DDE5EF" strokeWidth=".6" />
        </pattern>
      </defs>
      <rect width="320" height="240" fill="url(#bp)" />
      {category === 'pressure' && <Pressure s={state} />}
      {category === 'temperature' && <Temperature s={state} />}
      {category === 'mounting' && <Mounting />}
      {category === 'power' && <Power />}
    </svg>
  )
}

function Pressure({ s }: { s: Record<string, string> }) {
  const flange = s.conn === 'flange'
  const hyg = s.conn === 'tc' || s.conn === 'tc2' || s.conn === 'dairy'
  const ex = s.ex === 'exia' || s.ex === 'exd'
  const diff = s.type === 'd'
  const bodyW = ex && s.ex === 'exd' ? 78 : 64
  const cx = 160
  const cable = s.elec === 'cable' || s.ex === 'exd'
  const m12 = s.elec === 'm12'
  return (
    <g stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round">
      {/* разъём */}
      {cable ? (
        <g fill={FILL}><rect x={cx - 8} y="22" width="16" height="22" /><path d="M160 22V8" strokeWidth="5" stroke="#4F5F74" fill="none" /></g>
      ) : (
        <g fill={FILL}><rect x={cx - (m12 ? 9 : 16)} y="20" width={m12 ? 18 : 32} height="24" rx="2" />{!m12 && <line x1="146" y1="28" x2="174" y2="28" />}</g>
      )}
      {/* корпус */}
      <rect x={cx - bodyW / 2} y="44" width={bodyW} height="64" rx="6" fill="#fff" />
      {ex && <rect x={cx - bodyW / 2} y="60" width={bodyW} height="10" fill={ACCENT} stroke="none" opacity=".9" />}
      {ex && <text x={cx} y="68" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" stroke="none">Ex</text>}
      <rect x={cx - 28} y="82" width="56" height="18" rx="2" fill={FILL} />
      <text x={cx} y="95" textAnchor="middle" fontSize="8" fontFamily="IBM Plex Mono, monospace" fill={STROKE} stroke="none">
        {diff ? 'ΔP' : s.type === 'a' ? 'P abs' : 'P'}
      </text>
      {/* шестигранник */}
      <rect x={cx - 26} y="108" width="52" height="16" fill={FILL} />
      <path d="M134 108v16M146 108v16M158 108v16M170 108v16M182 108v16" strokeWidth=".8" />
      {/* присоединение */}
      {flange ? (
        <g fill={FILL}><rect x={cx - 52} y="124" width="104" height="12" rx="2" />{[-40, -14, 14, 40].map((x) => <circle key={x} cx={cx + x} cy="130" r="2.4" fill="#fff" />)}<rect x={cx - 18} y="136" width="36" height="28" /></g>
      ) : hyg ? (
        <g fill={FILL}><rect x={cx - 34} y="124" width="68" height="10" rx="2" /><rect x={cx - 22} y="134" width="44" height="26" /><ellipse cx={cx} cy="160" rx="22" ry="4" fill="#fff" /></g>
      ) : (
        <g fill={FILL}><rect x={cx - 15} y="124" width="30" height="46" />{Array.from({ length: 7 }).map((_, i) => <line key={i} x1={cx - 15} x2={cx + 15} y1={132 + i * 5} y2={128 + i * 5} strokeWidth=".9" />)}</g>
      )}
      <path d="M160 170v30" strokeDasharray="4 3" strokeWidth="1" stroke={ACCENT} />
      <path d="M154 196l6 8 6-8" fill={ACCENT} stroke={ACCENT} />
      {diff && <g fill={FILL}><rect x={cx - 58} y="108" width="14" height="40" rx="2" /><rect x={cx + 44} y="108" width="14" height="40" rx="2" /></g>}
    </g>
  )
}

function Temperature({ s }: { s: Record<string, string> }) {
  const len = Number(s.length ?? 100)
  const h = 60 + len * 0.6
  return (
    <g stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" fill={FILL}>
      <rect x="132" y="22" width="56" height="42" rx="5" fill="#fff" />
      <rect x="140" y="30" width="40" height="12" rx="2" />
      <path d="M160 22V10" strokeWidth="5" stroke="#4F5F74" fill="none" />
      {s.ex === 'exd' && <rect x="132" y="48" width="56" height="9" fill={ACCENT} stroke="none" />}
      <rect x="144" y="64" width="32" height="14" />
      <rect x="150" y="78" width="20" height="10" />
      <rect x="154" y="88" width="12" height={h} fill="#fff" />
      <path d={`M160 88v${h}`} strokeDasharray="3 3" strokeWidth=".8" />
      <circle cx="160" cy={88 + h + 4} r="4" fill={ACCENT} stroke="none" />
    </g>
  )
}

function Mounting() {
  return (
    <g stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" fill={FILL}>
      <rect x="110" y="70" width="100" height="70" rx="6" fill="#fff" />
      {[130, 160, 190].map((x) => (
        <g key={x}><rect x={x - 6} y="46" width="12" height="24" /><circle cx={x} cy="40" r="10" fill="#fff" /><path d={`M${x - 5} 40h10M${x} 35v10`} strokeWidth="1" /></g>
      ))}
      <rect x="96" y="96" width="14" height="18" /><rect x="210" y="96" width="14" height="18" />
      <rect x="148" y="140" width="24" height="26" />
      <circle cx="160" cy="105" r="5" fill={ACCENT} stroke="none" />
    </g>
  )
}

function Power() {
  return (
    <g stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" fill={FILL}>
      <rect x="80" y="50" width="160" height="110" rx="6" fill="#fff" />
      <rect x="96" y="66" width="70" height="30" rx="2" fill="#0B2A55" />
      <text x="131" y="86" textAnchor="middle" fontSize="16" fontFamily="IBM Plex Mono, monospace" fill={ACCENT} stroke="none">24.0</text>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={96 + i * 36} y="120" width="26" height="28" rx="2" />)}
      <circle cx="205" cy="80" r="6" fill={ACCENT} stroke="none" />
      <path d="M80 168h160" strokeWidth="3" stroke="#4F5F74" />
    </g>
  )
}
