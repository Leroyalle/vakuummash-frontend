# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Clickable design prototype of a Russian-language B2B site for an instrument-making plant (pressure/temperature sensors). No backend: all data is mocked. UI copy is in Russian.

## Commands

```bash
npm run dev         # Vite dev server (generates src/routeTree.gen.ts on the fly)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run build       # tsc --noEmit && vite build
```

There is no test runner. Verify changes with `typecheck` + `lint`, and by loading routes in a browser. Append `?mock=error` or `?mock=empty` to any URL to exercise error/empty states.

## Architecture

- **Routing**: TanStack Router, file-based (`src/routes`, plugin in `vite.config.ts`). `src/routeTree.gen.ts` is generated — never edit it; it only updates while Vite runs, so start `npm run dev` after adding/renaming route files before trusting `tsc`. Use `catalog/$category/index.tsx` + `$productId.tsx` (directory form): the dot form `$category.$productId.tsx` would nest the product route under the category route.
- **URL is state**: catalog filters (`src/lib/catalogSearch.ts`, Zod schema shared by `/catalog` and `/catalog/$category`) and the product configuration (`cfg=a0:1`, plus `qty`, `tab`) live in search params. Route components pass `onChange(patch)` into views rather than navigating inside shared components.
- **Data flow**: `scripts/migrate` (`npm run migrate`) scrapes vakuummash.ru (open WP REST API + product page HTML) → `src/data/*.json` + `public/assets/*`, validated by Zod in `src/data/schema.ts`. `src/data/index.ts` re-validates on load and builds UI types (`types.ts`); `src/api/index.ts` adds a 300–500 ms delay, `?mock=` flags, and catalog filtering/facets → `src/api/queries.ts` (`q.*`) → components via `useQuery` wrapped in `components/ui/Async.tsx` (loading/error/empty). Migrated HTML is rendered with `components/ui/Prose.tsx`. Remaining placeholders live in `src/data/mocks.ts` (see README). Never hand-edit the JSON; change the scripts and re-run.
- **Catalog filters** are data-driven: subcategories plus any product attribute with 2–14 distinct values become checkbox facets; selection is stored in the `f` search param (`{ [attributeName]: string[] }`).
- **Families**: `npm run structure` (`scripts/structure/`) turns the 142 migrated product pages into 32 families (`src/data/families.json`, `family-content.json`, `configs/<family>.json`, report `_structure-report.md`; Zod schemas in `src/data/structure-schema.ts`). The UI's `Product` is a family; its configurator schema comes from `configs/`, rules only from the source tables. Run `npm run structure` after changing `products.json`; it also verifies that each source modification is reproducible ("воспроизведено X из Y").
- **Configurator**: UI-free engine in `src/configurator/` (`resolve`, `normalize`, `encodeCfg`/`decodeCfg`). Option `value`s must not contain `:` or `,` (URL format).
- **Price mode**: `PRICE_MODE` in `src/config.ts`; prices are not published on the old site (`price: null`), so everything shows "request price" unless the data has a price.
- **Global modals**: `components/forms/ModalsContext.tsx` provides `openCallback()` / `openPrice(config?)`; mounted once in `routes/__root.tsx`. All forms use `LeadForm.tsx` (TanStack Form + Zod, fake submit).
- **Styling**: Tailwind v4, design tokens in `@theme` in `src/styles/index.css` (`brand-*` blue, `accent-*` orange for accents only, `ink-*` neutrals). Use `cn()` from `src/lib/cn.ts` (clsx + tailwind-merge) so responsive overrides like `hidden md:inline-flex` beat component defaults. Button styles live in `components/ui/buttonStyles.ts` (`buttonClass`) so `<Link>` can look like a button.

## Gotchas

- `@tanstack/react-table` is pinned to v8 (v9 has a different API).
- Tables inside `overflow-x-auto` wrappers need `relative`, otherwise `sr-only` (absolute) cells cause page-level horizontal overflow.
- ESLint (react-hooks v7) forbids setState inside effects; sync state from props via the "compare previous value during render" pattern (see `Header.tsx`, `CatalogView.tsx`). Route `component` must be a named function, not an inline arrow, when it calls `Route.useX()` hooks.
- Zero horizontal scroll is expected at 1440 / 768 / 390 widths.
- `public/assets/documents` is ~400 MB of PDFs; `.cache/` (raw HTTP/files) is git-ignored. Do not open migrated PDFs/images unless asked.
