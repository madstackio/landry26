# The Landry — landryliving.com

Leasing website for The Landry apartment community (2505 Thomason Cir,
Arlington, TX 76006), built with Astro 5 in SSR mode on Vercel and powered
headlessly by the LucidOS Website CMS.

## Setup

```sh
npm install
cp .env.example .env   # fill in CMS_API_KEY (from LucidOS → Website → The Landry)
npm run dev
```

Without a configured `.env`, pages render a setup notice instead of content.

## How it works

All content — pages, sections, floor plans, live availability, specials,
forms, SEO metadata, tracking IDs, contact info — comes from the LucidOS
API at request time. Content edits go live within ~a minute without a
deploy. **Read [`LUCIDOS.md`](./LUCIDOS.md) before changing anything
CMS-related.**

- `src/pages/[...slug].astro` — catch-all route (locale-aware) that fetches
  and renders CMS pages via `src/components/SectionRenderer.astro`
- `src/components/sections/` — one component per CMS section type, styled
  after the 2026 redesign (design tokens in `src/styles/tokens.css`)
- `src/pages/sitemap.xml.ts` / `robots.txt.ts` / `llms.txt.ts` —
  authenticated proxies to the CMS (never hand-author these)
- `src/middleware.ts` — LucidOS draft-preview support + cache/CSP headers

## Deploying

Vercel project with env vars `CMS_API_URL` and `CMS_API_KEY`
(`CMS_PREVIEW_TOKEN` on staging only). Do not enable the Vercel adapter's
`isr` option — it breaks the LucidOS editor preview (see `LUCIDOS.md`).
