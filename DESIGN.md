---
name: ВакууммашЭлектро
description: Строгий заводской каталог датчиков: синяя структура, один оранжевый акцент на главном действии, ряды и линии вместо плиток и теней.
colors:
  brand-950: "#071b3a"
  brand-900: "#0b2a55"
  brand-700: "#123f7a"
  brand-500: "#1f5fae"
  brand-300: "#7da7dc"
  brand-100: "#d9e6f7"
  brand-50: "#eef4fc"
  accent-400: "#ff8a47"
  accent-500: "#f26a1b"
  accent-600: "#d95a10"
  accent-700: "#b3470a"
  ink-800: "#1f2d3f"
  ink-600: "#4f5f74"
  ink-500: "#6b7b90"
  ink-300: "#c3cfdd"
  ink-200: "#dde5ef"
  ink-100: "#eaf0f7"
  ink-50: "#f3f5f8"
  white: "#ffffff"
  ok: "#1f8a4c"
  danger: "#c62f2f"
typography:
  display:
    fontFamily: "Fira Sans Condensed, Fira Sans, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Fira Sans Condensed, Fira Sans, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Fira Sans Condensed, Fira Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Fira Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Fira Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "Fira Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  sm: "2px"
  md: "3px"
spacing:
  gutter-sm: "16px"
  gutter-md: "24px"
  section-sm: "48px"
  section-md: "64px"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.accent-500}"
    textColor: "{colors.brand-950}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-400}"
  button-primary-active:
    backgroundColor: "{colors.accent-600}"
  button-secondary:
    backgroundColor: "{colors.brand-900}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 20px"
  button-secondary-hover:
    backgroundColor: "{colors.brand-700}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.brand-900}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 20px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-800}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 12px"
  badge:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.ink-600}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  product-card:
    backgroundColor: "{colors.white}"
    rounded: "0"
    padding: "20px"
  header:
    backgroundColor: "{colors.white}"
    height: "56px"
---

# Design System: ВакууммашЭлектро

## Overview

**Creative North Star: "Заводской каталог"**

Система читается как печатный промышленный каталог, перенесённый в браузер: структура задаётся глубоким синим, разделение даётся линиями в 1px, содержимое выстраивается рядами-таблицами. Закупщик должен за первый экран понять путь «подобрать, проверить документы, запросить цену», поэтому интерфейс плотный, спокойный и без украшений. Реальные артефакты (вырезанные фото изделий, сканы сертификатов, логотипы заказчиков) несут визуальный вес, а не иллюстрации и не плитки с тенями.

Плоскость везде: нет теней, нет скруглённых карточек, радиус 2px. Акцентный оранжевый встречается только у главного действия на экране (подобрать, запросить цену, отправить), поэтому его редкость и есть сигнал. Синие блоки на всю ширину (первый экран, форма, подвал) чередуются с белыми и светло-серыми полосами, задавая ритм страницы.

**Key Characteristics:**
- Fira Sans Condensed для заголовков и меню, Fira Sans для текста, Fira Mono для артикулов и числовых значений.
- Синий brand-900 как структурная краска; оранжевый accent-500 только на главной кнопке.
- Ряды с линиями 1px (border-t и border-b) вместо плиток; стрелка справа как указатель перехода.
- Полосы страницы чередуют белый, ink-50 и brand-900; первый экран и панель подбора перекрываются на 56px.
- Контейнер 80rem, поля 16px на мобильном и 24px от md.

## Colors

Холодная, почти монохромная палитра: тёмно-синий, серо-голубые нейтрали и один тёплый оранжевый.

### Primary
- **Заводской синий** (brand-900): заголовки h1-h4, фон первого экрана, формы и подвала, вторичная кнопка, обводка outline-кнопки, 3px подчёркивание активного пункта меню, верхние линии блоков преимуществ.
- **Глубокая ночь** (brand-950): верхняя служебная полоса, фон подвала, текст на оранжевой кнопке, оверлей меню.
- **Сигнальный синий** (brand-700): hover заголовков-ссылок, ссылки «Весь каталог» и подобные.
- **Рабочий синий** (brand-500): граница активного поля и карточки при наведении.
- **Туман** (brand-300, brand-100, brand-50): hover границы поля, вторичный текст на синем (brand-100), фон бейджа (brand-50).

### Secondary
- **Заводской оранжевый** (accent-500): фон основной кнопки и кольцо фокуса (2px, смещение 2px). Hover светлее (accent-400), active темнее (accent-600). accent-700 встречается только как hover ссылок внутри Prose.

### Neutral
- **Чернильный текст** (ink-800): основной текст.
- **Приглушённый текст** (ink-600): описания, лиды.
- **Подпись** (ink-500): даты, счётчики, плейсхолдеры, мета.
- **Линия** (ink-200): все разделители, рамки карточек, шапка.
- **Линия поля** (ink-300): рамка инпута, неактивные стрелки.
- **Подложка** (ink-100, ink-50): фон полос, шапок страниц, бейджей и hover ghost-кнопки.
- **Статус**: ok (#1f8a4c) для успеха, danger (#c62f2f) для ошибок полей.

### Named Rules
**The One Orange Rule.** Оранжевый красит одно главное действие на экране и кольцо фокуса. Не использовать его для заголовков, иконок, плашек и фонов секций.
**The Cold Neutral Rule.** Серые всегда сине-холодные (ink-*); тёплых серых и чистого чёрного нет.

## Typography

**Display Font:** Fira Sans Condensed (Fira Sans, system-ui)
**Body Font:** Fira Sans (system-ui)
**Label/Mono Font:** Fira Mono (ui-monospace)

**Character:** Узкая гротескная гарнитура для заголовков звучит инженерно и экономит ширину в русском тексте; нормальная ширина Fira Sans держит длинные описания читаемыми; моноширинная нужна для обозначений и счётчиков.

### Hierarchy
- **Display** (600, 36px до 72px по брейкпоинтам: text-4xl, sm 5xl, md 6xl, lg 7xl; 1.05; tracking-tight): только h1 главной.
- **Headline** (600, 30px на мобильном и 36px от md; заголовок секции в SectionHead; h1 внутренних страниц 36 и 48px): заголовки секций с нижней линией.
- **Title** (600, 20-24px, leading-snug): названия рядов каталога (xl, md 2xl), преимущества, новости, названия карточек (lg).
- **Body** (400, 15-16px, leading-relaxed для прозы): описания; лид 18px (text-lg) на синем.
- **Label** (500, 14px): подписи полей, кнопки (sm 14px, lg 16px), бейджи 12px.
- **Mono** (400, 14px, ink-500): счётчики в меню каталога, артикулы.

### Named Rules
**The Condensed Headlines Rule.** Заголовки, пункты меню (16px, 500) и названия в рядах только в Fira Sans Condensed; Fira Sans в заголовках не использовать.
**The Mono For Codes Rule.** Артикулы, обозначения и числовые счётчики идут Fira Mono.

## Layout

Единый контейнер container-page: максимум 80rem, поля 16px (мобильный) и 24px (от md). Вертикальный ритм секций py-12 (мобильный) и py-16 (от md). Раскладки двухколоночные с неравными колонками: 1.25fr/1fr (первый экран), 1.2fr/1fr (каталог), 1fr/2fr (преимущества), 1fr/1.4fr (документы), 1fr/1.1fr (форма). Липкие колонки (sticky top-32) удерживают заголовок или изделие рядом с длинным списком. Шапка липкая: служебная полоса 36px (от lg) и главная строка 56px. Панель подбора наезжает на первый экран на 56px (-mt-14). Горизонтального скролла нет на 1440, 768 и 390. Мобильное меню открывается правым ящиком шириной min(22rem, 92vw).

## Elevation & Depth

Система плоская: теней нет, глубина передаётся линиями 1px (ink-200), сменой фона полос (white, ink-50, brand-900) и белыми панелями на синем (изделие в первом экране, форма). Состояния показываются сменой цвета границы или текста (hover границы карточки на brand-500), а не подъёмом. Анимации входа короткие (150-300 мс, cubic-bezier(0.22, 1, 0.36, 1)), с reduced-motion сокращением до 0.01 мс.

### Named Rules
**The Flat Rule.** Никаких box-shadow, градиентов и стеклянных эффектов на поверхностях; разделение только линиями и сменой фона.

## Shapes

Прямоугольная геометрия: радиус 2px у кнопок, полей, бейджей, меню-триггера; 3px (radius-md) оставлен у редких оверлеев. Карточки каталога и фотографий без скругления, с рамкой 1px ink-200. Ряды разделены линиями border-t/border-b; стрелка ArrowRight 20px справа сдвигается на 4px при hover. Фотографии изделий вырезаны на белом (object-contain, mix-blend-multiply на светлом), сертификаты показаны как сканы 3:4 с рамкой.

## Components

### Buttons
- **Shape:** прямоугольник с радиусом 2px, высоты 36 / 44 / 48px (sm / md / lg), текст 14 / 14 / 16px, weight 500.
- **Primary:** оранжевый accent-500, текст brand-950. Hover accent-400, active accent-600.
- **Secondary:** фон brand-900, белый текст; hover brand-700.
- **Outline:** рамка 1px brand-900; hover заливка brand-900. На синем фоне: белая рамка и текст, hover белая заливка.
- **Ghost / Light:** hover ink-100. Фокус: 2px accent-500, смещение 2px.

### Inputs / Fields
- **Style:** белый фон, рамка 1px ink-300, радиус 2px, высота 44px, текст 14px; подпись над полем 14px brand-900.
- **Focus:** рамка brand-500 и кольцо accent-500 40%.
- **Error:** рамка danger, сообщение 12px danger с короткой анимацией shake.

### Cards / Containers
- **Product card:** белый фон, рамка 1px ink-200, радиус 0, галерея 160px сверху, текст с padding 20px, цена «по запросу» 14px semibold. Hover: рамка brand-500, «Подробнее» проявляется со стрелкой.
- **Panel on blue:** белый блок p-6 без рамки (изделие, форма).

### Navigation
- **Header:** белая, border-b ink-200; пункты Fira Sans Condensed 16px/500 brand-900, активный подчёркнут 3px brand-900. Мегаменю выпадает на всю ширину: две колонки, ряды с линиями и счётчиком в моно. Поиск по обозначению виден всегда (от 2xl в шапке, иначе в ящике).
- **Service bar:** brand-950, текст 13px, brand-100.

### Row list (signature)
Основной паттерн страницы: список с верхней и нижней линией, в строке заголовок Title слева, мета ink-500 и стрелка справа. Применяется для категорий, проектов, новостей. Заголовок строки brand-900, hover brand-700.

### Quick select (signature)
Белая панель с рамкой ink-200, заголовок «Подбор серии», в строку поля-селекты из фасетов каталога и кнопка Primary; на мобильном поля в столбец.

### Badges
Радиус 2px, 12px/500, фон ink-100 с текстом ink-600; tone brand: brand-50 / brand-700.

## Do's and Don'ts

### Do:
- **Do** красить только главное действие в accent-500 (текст brand-950) и держать его одним на экране.
- **Do** разделять содержимое линиями 1px ink-200 и рядами с границами, а не плитками.
- **Do** набирать заголовки Fira Sans Condensed 600, брендовым brand-900 (на синем белым).
- **Do** держать радиус 2px и плоские поверхности.
- **Do** показывать реальные артефакты (фото изделий, сканы документов, логотипы заказчиков) и только подтверждённые факты.

### Don't:
- **Don't** использовать тени, градиенты, glassmorphism и скруглённые карточки-плитки.
- **Don't** красить оранжевым заголовки, значки, плашки и фоны блоков.
- **Don't** добавлять надзаголовки-кикеры и иконки-глифы вместо контента.
- **Don't** использовать тёплые серые или чистый чёрный.
