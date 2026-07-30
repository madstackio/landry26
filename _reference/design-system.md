# The Landry — Design System

Multi-family apartment community in North Arlington, TX (2505 Thomason Cir, 76006 — landryliving.com). 288 units, 3-story buildings (1983, renovated). Pet-friendly; amenities: swimming pool, playground, fitness center, clubhouse with open kitchen, dog park, picnic/grill areas. Marketing surface: the leasing website (landryliving.com) plus tour collateral.

**Sources provided:** logo SVG + 4 property photos (uploads/, copied to `assets/`); brand note "warm, navy blue and whites. Blue is #154766". No codebase, Figma, or font files were provided — components below are an authored standard set, and fonts are Google-Fonts substitutions (see Visual Foundations).

## Content fundamentals
- Voice: warm, welcoming, lightly aspirational leasing copy. Speaks as "we/our" to "you/your": "take a dip in our swimming pool", "schedule a tour of your new home today!"
- Frames the property as *home*, not "units": "your new home", "apartment homes", "valued resident".
- Sentence case for body; short imperative CTAs ("Schedule a Tour", "View Floor Plans", "Call Us Today") in title case.
- Enthusiastic but not shouty — an exclamation point at most once per section. No emoji.
- Amenity language is concrete and sensory: "prepare the perfect meal in our open kitchen layouts", "enjoy getting active in our fitness center".
- Eyebrow labels in uppercase letterspaced sans (e.g. "LIFE AT THE LANDRY").

## Visual foundations
- **Color:** deep warm navy `#154766` (--navy-700) is the brand anchor — headers, buttons, footers. Logo mark carries a secondary slate `#A7B1BB`. Backgrounds are warm whites (`#FAF8F5`, `#F4F0EA`), never pure gray. Charcoal `#1F2124` echoes the property's black trim; cognac `#A8613A` (leather club chairs) is a sparing warm accent. Max 1–2 background colors per surface.
- **Type:** serif display (Marcellus, 400 only) for headings — matches the serif-caps wordmark; Source Sans 3 for body/UI. Headings in navy-900, generous size jumps (16 → 28 → 48). Uppercase letterspaced eyebrows.
- **Imagery:** real property photography, warm daylight, blue Texas skies; full-bleed heroes with a navy scrim gradient for text protection. No illustration.
- **Spacing:** 4px base scale, roomy sections (64–128px vertical). 1200px content max.
- **Corners & borders:** modest radii (4/8/12px); 1px warm borders (`--border-subtle`). Cards: white, radius-lg, soft navy-tinted shadow, no colored left borders.
- **Shadows:** two-level navy-tinted soft shadows (card / raised). Focus ring: 3px translucent navy.
- **Motion:** restrained — 120–200ms ease fades and gentle lifts (translateY(-2px) + raised shadow on card hover). No bounces.
- **Hover:** buttons darken one step (navy-700 → 800); links darken; press returns to darker still (navy-900), no shrink.
- **Transparency/blur:** none, except hero scrim gradients over photos.

## Iconography
No proprietary icon set was provided. Use **Lucide** (CDN) line icons, 1.5px stroke, sized 20/24px, colored `currentColor` — chosen to match the brand's thin serif/line aesthetic. This is a flagged substitution; replace if the brand adopts an official set. No emoji, no unicode-as-icons. Logo: `assets/logo.svg` (bird-over-rooftops mark, slate + navy).

## Intentional additions
- Standard component set (no source inventory existed): Button, IconButton, Input, Select, Checkbox, Radio, Switch, Card, Badge, Tag, Tabs, Dialog, Toast, Tooltip.

## Index
- `styles.css` → `tokens/` (colors, typography, spacing, effects)
- `assets/` — `logo.svg`, `photos/` (pool-courtyard, building-exterior, clubhouse-lounge, clubhouse-kitchen)
- `guidelines/` — specimen cards (colors, type, spacing, effects, brand)
- `components/forms/` — Button, IconButton, Input, Select, Checkbox, Radio, Switch
- `components/display/` — Card, Badge, Tag
- `components/navigation/` — Tabs
- `components/feedback/` — Dialog, Toast, Tooltip
- `ui_kits/website/` — leasing-website screens (index.html interactive)
- `SKILL.md` — agent skill entry point
