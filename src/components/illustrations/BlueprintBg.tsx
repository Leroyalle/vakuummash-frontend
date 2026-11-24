/** Фон первого экрана: миллиметровка чертёжного листа и контурный чертёж датчика давления. Чисто декоративный. */
export function BlueprintBg({ drawing = true }: { drawing?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.045)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.07)_1px,transparent_1px)] bg-[size:120px_120px]" />
      {drawing && <svg viewBox="0 0 400 900" className="absolute top-1/2 right-[-4%] hidden h-[135%] -translate-y-1/2 text-white/[0.09] lg:block" fill="none" stroke="currentColor" strokeWidth="1.5">
        {/* разъём */}
        <rect x="140" y="40" width="120" height="110" />
        {Array.from({ length: 9 }, (_, k) => <line key={k} x1={150 + k * 12.5} y1="40" x2={150 + k * 12.5} y2="150" />)}
        <rect x="155" y="150" width="90" height="40" />
        {/* корпус */}
        <rect x="130" y="190" width="140" height="300" />
        <line x1="130" y1="250" x2="270" y2="250" />
        <line x1="130" y1="430" x2="270" y2="430" />
        <circle cx="200" cy="340" r="34" />
        <circle cx="200" cy="340" r="18" />
        {/* шестигранник */}
        <path d="M110 490h180v80H110z" />
        <line x1="160" y1="490" x2="160" y2="570" /><line x1="240" y1="490" x2="240" y2="570" />
        {/* штуцер с резьбой */}
        <rect x="160" y="570" width="80" height="150" />
        {Array.from({ length: 11 }, (_, k) => <line key={k} x1="160" y1={585 + k * 12} x2="240" y2={591 + k * 12} />)}
        <rect x="180" y="720" width="40" height="40" />
        {/* осевая и размерные линии */}
        <line x1="200" y1="10" x2="200" y2="800" strokeDasharray="18 6 3 6" strokeWidth="1" />
        <line x1="330" y1="40" x2="330" y2="760" strokeWidth="1" />
        <line x1="320" y1="40" x2="340" y2="40" strokeWidth="1" /><line x1="320" y1="760" x2="340" y2="760" strokeWidth="1" />
        <line x1="110" y1="820" x2="290" y2="820" strokeWidth="1" />
        <line x1="110" y1="810" x2="110" y2="830" strokeWidth="1" /><line x1="290" y1="810" x2="290" y2="830" strokeWidth="1" />
      </svg>}
    </div>
  )
}
