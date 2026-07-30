# The Landry — LucidOS Headless CMS Integration Guide

This file teaches AI coding agents (Claude Code, Cursor, etc.) how this
website consumes its content from the LucidOS Website CMS. Keep it at the
repo root as `LUCIDOS.md` and reference it from your agent's own
instructions file so it's always loaded — e.g. add `@LUCIDOS.md` on its
own line in `CLAUDE.md` (Claude Code), or point to it from `AGENTS.md` /
your Cursor rules.

## What this is

The website is **headless**: all marketing content — pages, sections, floor
plans, live unit availability, specials, and forms — is managed in LucidOS
and served as JSON from a REST API. The site fetches content at build time
or server-side and renders it. Content edits go live without redeploying:
browsers never cache API responses (max-age=0), only the CDN does (~60–120s),
and a `content.updated` webhook is available for instant revalidation.

## Connection

- **Base URL**: `https://lucid.madstack.io/api/website/v1/the-landry`
- **Auth**: send `x-api-key: <key>` on every GET (keys look like `wsk_live_…`)
- **Env convention**: `CMS_API_URL` (the base URL) and `CMS_API_KEY`
- **CRITICAL — key handling**: the API key is a server-side secret. Only call
  the API from server/build code (Astro frontmatter, server routes, getStaticProps).
  NEVER put the key in browser JavaScript. The ONE exception is the form
  submit endpoint, which requires no key and is safe to call from the browser.

## Endpoints (all GET unless noted)

| Path | Returns |
|---|---|
| `/globals` | Site config: `{ name, default_locale, locales, branding, contact, social, tracking, custom_head_tags, portal_url, recaptcha_site_key, logo_url, favicon_url, json_ld }` |
| `/pages` | `{ pages: [{ slug, title, meta_title, meta_description, order_index }] }` — build navigation from this |
| `/pages/{slug}` | `{ slug, title, meta: { title, description, keywords, og_image_url, canonical_url, noindex }, json_ld, sections: Section[] }` |
| `/content/{type}` | `{ type, type_name, items: [{ id, title, slug, data, order_index }] }` — all published sections of a content type |
| `/content/{type}/{slug}` | `{ type, type_name, item }` — one section |
| `/floor-plans` | `{ floor_plans: [{ name, slug, description, bedrooms, bathrooms, sqft_min, sqft_max, features[], photos: [{url, alt}], available_count, starting_rent, available_from }] }` |
| `/availability` | `{ units: [{ unit_id, unit_number, bedrooms, bathrooms, square_footage, market_rent, available_now, available_date, floor_plan: { slug, name } \| null }], count }` — filters: `?beds=&baths=&max_rent=&move_in=YYYY-MM-DD`. `floor_plan` is an OBJECT (or null), never a string |
| `/specials` | `{ specials: [{ title, description, disclaimer, display_mode, starts_at, ends_at, floor_plan, image }] }` — only promos inside their date window. `display_mode` is the editor's chosen presentation: `"text"` (render the copy), `"image"` (render only `image` as a banner — use `title` as its alt text), or `"image_text"` (compose both). Respect it rather than inferring from which fields are set. `floor_plan` is `{ slug, name } \| null`; `image` is `{ url, alt } \| null` |
| `/forms/{slug}` | `{ id, name, redirect_url, recaptcha_required, recaptcha_site_key, submit_url, fields: [{ id, label, type, required, options, option_labels }] }` — `options` are canonical VALUES (always submit these); `option_labels` are index-aligned display labels (translated under `?locale=`, `null` for option-less fields) |
| `/forms/{slug}/submit` | **POST**, no API key. Body: `{ data: { [fieldId]: value }, recaptcha_token?, source_url? }` → `{ ok, submission_id, redirect_url }` (201) or `{ error, details? }` |
| `/sitemap.xml` | XML sitemap over published, indexable pages (absolute URLs on the primary domain). Proxy it at your root — see "Root search files" |
| `/robots.txt` | Crawl policy (AI-crawler allow/block + custom disallows, managed in LucidOS) with the sitemap reference. Proxy at your root |
| `/llms.txt` | Markdown site summary for AI answer engines (pages, floor plans, specials, FAQs, contact). Proxy at your root |

## The content model

- A **page** is an ordered list of **sections**. Each section has a
  `type` (the content type's slug) and a `data` object whose keys are the
  type's field keys.
- Render pages with a **component map**: `{ "hero-section": Hero, "text-block": TextBlock, … }`,
  looking up each `section.type`. Render `null` for unknown types so new
  CMS types never break the site.
- Built-in section types and their data shapes:
  - `hero-section`: `{ heading, subheading?, background_image?, background_video?, overlay?, alignment?, buttons?: [{label, url, style}] }`
  - `text-block`: `{ heading?, body }` (body is HTML)
  - `amenities-grid`: `{ heading?, amenities: [{icon?, title, description?}] }`
  - `image-gallery`: `{ heading?, images: [{image, caption?}] }`
  - `cta-banner`: `{ heading, body?, background_image?, buttons: [{label, url, style}] }`
  - `faq`: `{ heading?, items: [{question, answer}] }` (answer is HTML)
  - `testimonials`: `{ heading?, testimonials: [{quote, author?, role?, avatar?}] }`
  - `feature-grid`: `{ heading?, subheading?, features: [{icon?, image?, title, description?, link_url?}] }`
  - Custom types may exist — always render defensively.
- Field value conventions: `image` and `video` fields are **URL strings**
  (public CDN links — hot-link them directly); `gallery` fields are
  **arrays of image URL strings**; `richtext` fields are HTML strings;
  `repeater` fields are arrays of objects.
- HTML-bearing values are **sanitized server-side** to a fixed allowlist.
  `richtext` may contain `p, h1–h4, strong/b, em/i, u, s, mark, a, ul, ol,
  li, blockquote, br, hr`. Short text fields with inline styling enabled
  (typically headings) are **inline-only fragments** — just
  `strong/em/u/s/mark`, no wrapper element — so inject them inside your own
  tag, e.g. `<h1 dangerouslySetInnerHTML={{ __html: data.heading }} />`.
  Style `<mark>` (highlight) and `<u>` to match the site's brand. Fields
  without inline styling stay plain text — render them as text, not HTML.

## Live (data-bound) sections

Some section types are **live**: instead of static content, they carry the
editor's query config, and the API hydrates them **server-side at request
time** with fresh data from the property's synced rent roll. Hydrated
sections arrive in the same `sections` array with two extra keys —
`live: true` and `source` — and their `data` contains the config fields
**plus** `items` (the resolved records) and `count` (total matches before
any `max_*` limit, so "showing 3 of 7" treatments are possible).

No second fetch is needed: render `data.items` directly. Item shapes are
**identical** to the standalone endpoint for the same source:

- `floor-plan-grid` (`source: "floor_plans"`): `data: { heading?, intro?, max_plans?, bedrooms?, only_available?, sort?, items: FloorPlan[], count }` — items match `/floor-plans` exactly.
- `availability-list` (`source: "availability"`): `data: { heading?, max_units?, bedrooms?, bathrooms?, max_rent?, items: AvailableUnit[], count }` — items match `/availability` units exactly.
- `specials-strip` (`source: "specials"`): `data: { heading?, max_specials?, items: Special[], count }` — items match `/specials` exactly.

The config keys are data-shaping only — presentation is entirely yours.
If a live source fails upstream, the section still arrives with
`items: []` and `count: 0`; design an empty state. Orgs can duplicate a
live built-in under a custom slug, so check `section.live` / `section.source`
rather than hard-coding the three slugs above.

**Field-level live blocks**: any section type (including static ones) may
embed `live_block` fields. Those sections arrive with `live: true` and
`live_fields: ["<key>", …]`, and each listed key holds
`{ source, …config, items, count }` — items shaped identically to that
source's standalone endpoint. Example: a hero with an availability ticker is
one section whose `data.ticker.items` is the live unit list. Render
defensively: iterate `live_fields` when present instead of assuming which
keys are live.

**Form blocks** (`source: "form"`) are references, not queries: the block
arrives as `{ source: "form", form_id, form }` where `form` is the full
`/forms/{slug}` schema (fields, `submit_url`, reCAPTCHA config) — build one
generic Form component from it and POST answers to `submit_url` exactly as
described in the Forms section. `form` is `null` when the referenced form is
missing or not active: hide the block. The built-in `form-section` type is
the ready-made heading + intro + form composition; editors can swap which
form it carries without a website deploy.

## SEO & structured data

- Build every page's `<head>` from `meta`: title, description, OG tags
  (`og_image_url`), `<link rel="canonical">` from `canonical_url`, and a
  `robots` noindex tag when `noindex` is true.
- `json_ld` arrays are **ready to render** — emit each item verbatim as
  `<script type="application/ld+json">{JSON.stringify(item)}</script>`.
  `/globals` items go on every page (site-wide LocalBusiness /
  Organization markup); `/pages/{slug}` items go only on that page. Never
  hand-edit or re-shape the objects — they're validated and serialized by
  the CMS.
- `globals.tracking` carries analytics IDs (all optional) — inject the
  matching standard snippet on every page for each ID that's present, and
  skip services whose ID is absent:
  - `ga4_measurement_id` (`G-…`): standard gtag.js loader + `gtag('config', id)`.
  - `gtm_container_id` (`GTM-…`): GTM script in `<head>` AND the noscript
    iframe right after `<body>`.
  - `google_ads_id` (`AW-…`): extra `gtag('config', id)` (share the gtag.js
    loader with GA4 if both are set).
  - `meta_pixel_id` (digits): standard Meta Pixel snippet + noscript img.
  Source these from `/globals` at build/request time so editors can change
  IDs without a website deploy.
- Inject `globals.custom_head_tags` (raw HTML string, may be null) into
  `<head>` on every page.
- Build footers and contact UI from `globals.contact` (`email`, `phone`,
  `address_line1/2`, `city`, `state`, `zip`, `office_hours`) and
  `globals.social` (`facebook`, `instagram`, `twitter`, `linkedin`,
  `youtube`, `tiktok` — full profile URLs). All fields are optional —
  render only what's present. Sourcing these from `/globals` (never
  hard-coding them) keeps the site in sync with LucidOS settings and
  consistent with the structured data.

## Root search files (sitemap.xml, robots.txt, llms.txt)

Search engines and AI crawlers expect these at the site root
(`https://yourdomain.com/sitemap.xml` etc.), but the CMS endpoints require
the `x-api-key` header — and rewrites can't attach headers. Add one tiny
proxy route per file. Next.js App Router example (repeat for
`robots.txt/route.ts` and `llms.txt/route.ts`):

```ts
// app/sitemap.xml/route.ts
export async function GET() {
  const res = await fetch(`${process.env.CMS_API_URL}/sitemap.xml`, {
    headers: { "x-api-key": process.env.CMS_API_KEY! },
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "text/plain",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
```

Astro: the same fetch in `src/pages/sitemap.xml.ts` returning
`new Response(body, { headers })`. Do NOT statically generate these at build
time — the CMS content changes without a redeploy. Crawl policy (AI-crawler
blocking, disallowed paths, the homepage slug) is managed in LucidOS under
SEO → Health, so never hand-author robots.txt or a sitemap alongside these
proxies.

## Forms

1. Fetch `/forms/{slug}` server-side to get the fields; use each field's
   `id` as the input name.
2. POST answers to `submit_url` (from the schema) — directly from the
   browser is fine, no key. Keys of `data` are the field ids.
3. When `recaptcha_required` is true, obtain a reCAPTCHA v3 token with the
   provided `recaptcha_site_key` and include it as `recaptcha_token`.
4. On success follow `redirect_url` when present; on 400 show
   `details[]` (human-readable validation messages).
5. Submissions are origin-checked — the site's domain must be in the CMS
   origin allowlist (managed in LucidOS Settings).

## Languages (i18n)

- `/globals` returns `default_locale` (the base language) and `locales`
  (extra languages the site serves). When `locales` is non-empty, build a
  locale-prefixed route per language (e.g. `/es/...`) — subpath routing is
  the SEO-correct setup.
- Append `?locale=es` to ANY endpoint to get that language. Translation is
  field-level with automatic fallback: untranslated fields arrive in the
  default language, so responses are always complete — never render empty
  strings or hide sections based on locale.
- The response shape is IDENTICAL across locales — one component tree,
  locale-parameterized fetches. Do not fork templates per language.
- Emit `hreflang` alternate links between locale variants of each page
  (including `x-default` → the default-locale URL).
- Forms: display `field.label` and `option_labels[i]`, but always submit
  the canonical `options[i]` value — submissions and lead routing stay in
  the default language. Availability/floor-plan numbers are
  locale-independent — format prices/dates with `Intl` using the active
  locale.
- Your own UI strings (nav, buttons) are your framework's i18n concern —
  the CMS only translates managed content.

## Keeping content fresh

- API responses send `Cache-Control: public, max-age=0, must-revalidate`
  (browsers always revalidate) plus `CDN-Cache-Control` with a short
  `s-maxage` (~60–120s per endpoint). An SSR site therefore shows CMS edits
  within a minute or two with no action needed. Do not add your own
  long-lived caching around CMS fetches without a purge path.
- For **instant** updates, register a webhook in LucidOS (Settings →
  Webhooks) subscribed to `content.updated`. It POSTs
  `{ event, site, resource, action, slug, occurred_at }` — signed like all
  webhooks (see below) — whenever pages, sections, floor plans, specials,
  forms, SEO schemas, or site globals change. Wire it to your platform's
  revalidation: a Next.js route handler calling `revalidatePath()` /
  `revalidateTag()`, or your host's deploy hook for statically-built sites
  (debounce rebuilds — edits arrive in bursts).
- Verify the webhook signature before acting: recompute HMAC-SHA256 over
  `${x-lucidos-timestamp}.${rawBody}` with the endpoint's secret and
  compare to `x-lucidos-signature`.

## Draft preview & the live preview bridge

Two ways a request enters preview mode (both include draft pages/sections and
disable caching):

1. `x-preview-token` header alongside the API key — wire via a
   `CMS_PREVIEW_TOKEN` env var on staging only, never production.
2. `?lucid_preview=<token>` query param — this is how the LucidOS editor's
   live preview iframe and shareable preview links work. Resolve it
   per-request server-side: check the query param first, then the
   `lucid_preview` session cookie, and pass the value as the
   `x-preview-token` header on your CMS fetches for that request.

**Build the preview bridge** (strongly recommended — the LucidOS editor shows
this site in a split-view iframe while editing):

- Add an inline script to the base layout that, when running inside an
  iframe with a `lucid_preview` token: persists the token to a session
  cookie (`SameSite=None; Secure`), posts
  `{ source: "lucid", v: 1, type: "bridge:ready", payload: { href, path, capabilities: ["reload", "highlight"] } }`
  to the admin origin, and listens for messages (validating
  `event.origin` against the admin origin): `admin:content-updated` →
  `location.reload()`; `admin:highlight { instanceId }` → find
  `[data-lucid-section="<instanceId>"]`, scroll it into view, and outline it.
  The exact script is in the LucidOS Developers tab → "Live preview bridge".
- Wrap every rendered page section with `data-lucid-section={section.id}`
  so the editor can spotlight the section being edited.
- Preview pages must be server-rendered (not fully static), and the site's
  CSP must allow framing by the admin:
  `frame-ancestors 'self' <admin-origin>` (no `X-Frame-Options: DENY`).
- When a preview token is present, set `Cache-Control: private, no-store`
  on the HTML response (Astro: `Astro.response.headers.set(...)`). Without
  it the host's edge cache replays stale HTML after the editor saves, and
  the preview looks broken for ~a minute. Forwarding the token also makes
  the CMS skip its own CDN cache, so preview data is always fresh.
- **Do NOT use the Vercel adapter's `isr` option** — ISR-cached pages
  ignore query strings and cookies, so the preview token never reaches
  your code and the editor preview serves stale, published-only HTML.
  Cache per-response instead: `CDN-Cache-Control: public, s-maxage=60,
  stale-while-revalidate=300` for normal requests, `no-store` when a
  preview token is present. Same visitor performance, preview stays live.

## AI chat widget

The site can embed LucidOS's AI leasing chat (answers availability/pricing
questions from live data, captures leads, books tours). One script tag before
`</body>`:

```html
<script src="https://lucid.madstack.io/widget/chat/v1.js" data-site="the-landry" async></script>
```

Or the React wrapper: `import { LucidChat } from "@reap/cms-sdk/chat/react"` →
`<LucidChat site="the-landry" />`. No API key involved — the widget iframe
authenticates itself. It only appears when the org has enabled the agent
(LucidOS → Website → AI Agent), so it is always safe to include.

## Errors

- `401` — missing/invalid API key, or the key belongs to a different site
- `404` — unknown page/type/slug/form
- `400` — bad query params or failed form validation (`details[]`)
- Error bodies are `{ "error": string }`

## Minimal fetch client

```ts
const BASE = import.meta.env.CMS_API_URL; // https://lucid.madstack.io/api/website/v1/the-landry
const KEY = import.meta.env.CMS_API_KEY;

export async function cms<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { "x-api-key": KEY } });
  if (!res.ok) throw new Error(`CMS ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}
```

## Site facts

- Site name: The Landry
- Site slug: `the-landry`
- Production domain: landryliving.com
- reCAPTCHA: configured (tokens required on form submits)
- Managed in LucidOS → Apps → Website → The Landry
