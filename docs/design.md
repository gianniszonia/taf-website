# Design system and client decisions

The client (a friend of the repo owner, who relays feedback) wants **simplicity and elegance**, easy browsing of
each brand's products, and a landing page with a "wow" factor — achieved with restraint, not effects.
Inspiration studied: Minotti, B&B Italia, Molteni&C (pale neutral background, short nav, full-bleed imagery,
few large headings, consistent product imagery).

## Tokens (`site/css/styles.css` `:root`)

| Token | Value | Use |
|---|---|---|
| `--paper` / `--paper-2` | `#f5f3ef` / `#ece8e1` | page / image placeholder backgrounds |
| `--ink` / `--ink-2` / `--mute` | `#171615` / `#4b4742` / `#8c867d` | text |
| `--accent` | `#b9532a` | tiny details only (form errors, ticker dots); derived from TAF logo orange `#ec6c34` |
| `--serif` | Noto Serif Display | headings, brand & product names, hero title |
| `--sans` | Manrope (400/500/600) | body, labels, buttons, nav |
| `--max` / `--pad` | 1440px / clamp(20px, 5vw, 72px) | content width / side gutter |

Both fonts cover Latin, Greek and Cyrillic (checked via Google Fonts subsets). Noto Serif Display is loaded as a
**variable range 200..500** so in-between weights work.

## Pages

| Route | Content |
|---|---|
| `#/` | Hero slideshow (brand covers) → statement → brand-name ticker → brand index with hover preview (`feature` images, never the same as the slideshow) + "Also in our showrooms" → **Selected pieces** (4 rotating cards) → inspiration teaser (3 projects, first wide) → appointment band → showrooms strip |
| `#/brands` | Large tiles per featured brand + list of other brands |
| `#/brand/<id>` | Hero (cover) → intro → sticky category tabs → 4:3 product grid → appointment band → "Next brand" |
| `#/inspiration` | Tiles per project (first wide), title + photo count |
| `#/inspiration/<slug>` | Hero (project cover) → masonry gallery (natural aspect ratios) → appointment band → "Next project" |
| `#/showrooms` | Four cities: addresses, phones, Natuzzi store, Google opening hours with live open/closed status, directions |
| `#/story` | Company history and milestones |
| Product viewer | Dialog: one photo (left) + name, Brand, Category, **Book an appointment**, **Visit website** (right); arrows/swipe/keys step through the cards currently on screen. Nothing else, by design. |
| Photo viewer | Same dialog in `.photo` mode for inspiration: full photo (contain) on near-black, arrows, counter |
| Booking | Side sheet: showroom, interest, date (Sundays/closed days blocked), time slots from real hours, name, phone… **demo only** |

## Landing hero (most-iterated part — current spec)

- Title: `Furnishing homes` / `since 1965.` (translated; no eyebrow line, no subtitle — both removed on request).
- Font: **Noto Serif Display, weight 330**, `clamp(42px, 5.3vw, 96px)`, letter-spacing −0.02em; both lines same
  colour/weight, flush left (no italic, no indent). Mobile: `clamp(34px, 9.6vw, 48px)`, line-height 1.12.
- Each line is in a `.line-mask` (overflow hidden for the slide-up reveal). Masks have
  `padding-bottom: .44em; margin-bottom: -.28em` so descenders (g, ς, д) are **not clipped** while line spacing
  stays 1.18em. If you change font/size, re-measure (see AGENTS.md → Verifying).
- Layout: message block vertically centred between header and a bottom bar, on the same left edge as the logo.
  Bottom bar (`.hero-bar`, 84px / 64px mobile): brand name + country·year (links to brand) on the left, `01 / 05`
  counter + progress lines on the right (phones: name + counter only).
- CTAs: primary white button "Explore the brands", secondary text link "Book an appointment". Header keeps its own
  "Book an appointment" button (top-right, aligned to content edge) — the client wants it there.
- Images: brand `cover.jpg` files (hand-picked, 1920–2400 px), **no zoom/Ken Burns**, cross-fade **0.9s**, 7s per slide.
- Scrim (`.hero::after`): flat 24% + left-to-right 60%→36%→6%→0 + top/bottom bands. Measured WCAG contrast of
  white title over every slide: median 6.4–16:1, brightest 10% of pixels ≥ 3.0:1 (large-text minimum).

## Imagery rules

- Room-set photography only; **one photo per product**, landscape, shown cropped 4:3 on cards and uncropped (cover-fit)
  in the viewer. Inspiration galleries may mix landscape and portrait room shots.
- No studio cut-outs, no close-ups, no bathrooms/corridors/details, no brand logos (inconsistent JPG/PNG styles) —
  brand names are typeset in the serif.
- Each featured brand has `cover.jpg` (slideshow + brand hero) and `feature.jpg` (home brand index) — different photos.

## Motion (kept deliberately small)

Line-mask title reveal; `.wipe` clip-path image reveal; staggered card rise; gentle parallax on hero/band images;
slow brand-name ticker; page cross-fade between routes; hero cross-fade; Selected pieces rotation (one card fades
out/in every ~3.8 s, in slot order; pauses on hover, while a dialog is open, or when the tab is hidden).
All disabled under `prefers-reduced-motion`.

## Copy & tone

- About TAF: a Cypriot family business since 1965 ("Furnishing homes since 1965", "Three generations").
- Brands described by **country** ("Italy · 1970", "Denmark · 1987"), not Italian regions.
- Navigation: Brands · Showrooms · Our Story · [EN | ΕΛ | РУ] · Book an appointment.
- Footer (black): all 16 brands in four columns with country (featured → internal page, others → website ↗),
  then logo/tagline, showrooms, TAF contact, social. No big tagline in the footer (removed on request).

## Rejected options (don't reintroduce without asking)

| Rejected | Why |
|---|---|
| "L'arte di abitare" tagline | real company name; too Italian-centric |
| Heavy "Italian design" copy, "The Houses" naming | not all brands Italian; renamed "Brands" |
| Manrope (sans) hero title | client preferred the serif after a 6-font comparison |
| Noto Serif Display 400, 116px | "too bold, heavy and big, takes away elegance" |
| Italic indented "since 1965." | client wanted same colour/weight, flush left |
| Ken Burns zoom on hero images | client asked for no zoom until images change |
| 2.2s cross-fade | "make transitions shorter" → 0.9s |
| Eyebrow line + subtitle in hero, scroll-cue line | client struck them out |
| Hiding header CTA on the landing | broke right alignment of the language switch |
| Mixed cut-out + room photos, brand logos, 400-product collection page | looked "assembled from many places" |
| Multi-photo product galleries, descriptions, designers, dimensions | client: one photo per product, "keep things at minimum" (details not available for all products) |
| Partner-site scraping / sync | removed by the client — content is added manually (see docs/history.md) |
