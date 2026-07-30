# The Landry — landryliving.com

Astro 5 (SSR, Vercel adapter) leasing website for The Landry apartments in
North Arlington, TX. All content is served headless from the LucidOS Website
CMS — read the integration guide before touching CMS-related code:

@LUCIDOS.md

## Commands

- `npm run dev` — dev server (needs `.env`, see `.env.example`)
- `npm run build` — production build (SSR; no CMS calls at build time)

## Architecture

- `src/pages/[...slug].astro` — catch-all: resolves locale prefix, fetches
  globals/pages/specials/page from the CMS, renders sections. Root path
  renders the first page by `order_index`.
- `src/components/SectionRenderer.astro` — component map keyed by section
  `type`, live sections routed by `source`. Unknown types render null.
- `src/components/sections/*` — one component per CMS section type, styled
  after the 2026 redesign (see `_reference/` for the original template).
- `src/lib/cms.ts` — typed fetch client (server-only; holds the API key).
- `src/middleware.ts` — LucidOS preview-token resolution, cache headers
  (no ISR — it breaks editor preview), CSP frame-ancestors for the editor.
- `src/pages/{sitemap.xml,robots.txt,llms.txt}.ts` — authenticated proxies
  to the CMS; never hand-author these files.

## Conventions

- CMS-managed content (contact info, tracking IDs, nav, copy) must come from
  the API — never hard-code it. The one deliberate exception: the property's
  map coordinates in `FormSection.astro`.
- Design tokens live in `src/styles/tokens.css` (ported from the design
  system package); components use scoped styles referencing those variables.
- Headings from the CMS may contain inline HTML (`strong/em/u/s/mark`) —
  render with `set:html` inside your own tag. `richtext` bodies get the
  `.richtext` class.
