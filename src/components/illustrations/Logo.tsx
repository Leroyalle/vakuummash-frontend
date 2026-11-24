/** Логотип «ВАКУУММАШ ЭЛЕКТРО» — оригинальный файл с vmelectro.ru, 1 в 1. На тёмном фоне — на белой плашке, чтобы не искажались цвета. */
export function Logo({ light, compact }: { light?: boolean; compact?: boolean; descriptor?: boolean }) {
  const img = <img src={`${import.meta.env.BASE_URL}brand/logo.png`} alt="ВАКУУММАШ ЭЛЕКТРО" width={727} height={179} className={compact ? 'h-auto w-full max-w-[15rem]' : 'h-12 w-auto sm:h-16 xl:h-[4.5rem]'} />
  return light ? <span className="inline-flex bg-white px-3 py-2">{img}</span> : img
}
