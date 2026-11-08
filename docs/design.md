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
| `--accent` | `#b9532a` | tiny details only (form errors); derived from TAF logo orange `#ec6c34` |
| `--serif` | Noto Serif Display | headings, brand & product names, hero title |
| `--sans` | Manrope (400/500/600) | body, labels, buttons, nav |
| `--max` / `--pad` | 1440px / clamp(20px, 5vw, 72px) | content width / side gutter |

Both fonts cover Latin, Greek and Cyrillic (checked via Google Fonts subsets). Noto Serif Display is loaded as a
**variable range 200..500** so in-between weights work.

## Pages

| Route | Content |
|---|---|
| `#/` | Hero slideshow (brand covers) → statement → brand index with hover preview (`feature` images, never the same as the slideshow) + "Also in our showrooms" → **Selected pieces** (manual carousel) → inspiration teaser (3 projects, first wide) → appointment band → showrooms strip |
| `#/brands` | Large tiles per featured brand + list of other brands |
| `#/brand/<id>` | Hero (cover) → intro → sticky category tabs → 4:3 product grid → appointment band → "Next brand" |
| `#/inspiration` | Tiles per project (first wide), title + photo count |
| `#/inspiration/<slug>` | Hero (project cover) → translated project description and linked collaboration credit where present → masonry gallery (natural aspect ratios) → appointment band → "Next project" |
| `#/showrooms` | Four cities: addresses, phones, Natuzzi store, Google opening hours with live open/closed status, directions |
| `#/story` | Company introduction from Who we are, followed by seven dated archive photographs from Our History; photographs are displayed without enlargement |
| Product viewer | Dialog: one photo (left) + name, Brand, Category, **Book an appointment**, **Visit website** (right); arrows/swipe/keys step through the cards currently on screen. Nothing else, by design. |
| Photo viewer | Same dialog in `.photo` mode for inspiration: full photo (contain) on near-black, arrows, counter |
| Booking | Side sheet: showroom, interest, date (Sundays/closed days blocked), time slots from real hours, name, phone… **demo only** |

## Landing hero (most-iterated part — current spec)

- Title: `Furnishing homes` / `since 1965.` (translated; no eyebrow line, no subtitle — both removed on request).
- Font: **Noto Serif Display, weight 330**, `clamp(38px, 4.2vw, 72px)`, letter-spacing −0.02em; both lines same
  colour/weight, flush left (no italic, no indent). Mobile: `clamp(32px, 8.2vw, 40px)`, line-height 1.12.
- Each line retains its `.line-mask` wrapper, with no entrance animation on the home page. Wrappers have
  `padding-bottom: .44em; margin-bottom: -.28em` so descenders (g, ς, д) are **not clipped** while line spacing
  stays 1.18em. If you change font/size, re-measure (see AGENTS.md → Verifying).
- Layout: message block vertically centred between header and a bottom bar, on the same left edge as the logo.
  Bottom bar (`.hero-bar`, 84px / 64px mobile): brand name + country·year (links to brand) on the left, `01 / 05`
  counter + progress lines on the right (phones: name + counter only).
- CTAs: compact 46px outline button "Explore the brands", secondary text link "Book an appointment". Header keeps its own
  "Contact us" control (top-right, aligned to the content edge), with booking and contact choices.
- Images: brand `cover.jpg` files (hand-picked, 1920–2400 px), **no zoom/Ken Burns**, cross-fade **0.9s**, 7s per slide.
- Scrim (`.hero::after`): flat 24% + left-to-right 60%→36%→6%→0 + top/bottom bands. Measured WCAG contrast of
  white title over every slide: median 6.4–16:1, brightest 10% of pixels ≥ 3.0:1 (large-text minimum).

## Imagery rules

- Room-set photography only; **one photo per product**, landscape, shown cropped 4:3 on cards and uncropped (cover-fit)
  in the viewer. Inspiration galleries may mix landscape and portrait room shots.
- No studio cut-outs, no close-ups, no bathrooms/corridors/details, no brand logos (inconsistent JPG/PNG styles) —
  brand names are typeset in the serif.
- Each featured brand has `cover.jpg` (slideshow + brand hero) and `feature.jpg` (home brand index) — different photos.

The landing slideshow opens with Natuzzi Italia's Borghese room photograph.
Home section titles, brand names, statement and appointment-band heading use a smaller, quieter type scale.
These refinements are scoped to the home content; the header and footer retain their existing styling.

## Inspiration project details

Each project has a hand-maintained `project.json` alongside its photos, containing source-based descriptive
copy in English, Greek and Russian, plus its source URL. Descriptions sit above the gallery in a simple two-column
layout on desktop and a single column on mobile. Serene Apartment, Seaside Dwelling and Golden Glow Nest credit
Christia Angelidou Architects and link to `https://angelidouarchitects.com/`, as their original descriptions do.

## Booking controls

The interest field opens a styled, scrollable brand list with a marked selection. The entire date field opens
a matching calendar panel, with translated month/day labels, month navigation and selectable showroom days from
tomorrow through 90 days ahead. Closed days are disabled. Both controls support keyboard use; Escape closes the
open picker before closing the booking sheet. The form remains a demo and sends nothing.

## Motion (kept deliberately small)

The landing title, buttons, caption and images appear immediately, without entrance fades or slide-ups. The home
brand-name strip has been removed. Keep the hero photograph cross-fade and hover feedback. While scrolling away from
the landing, only the hero photograph moves at a slower rate (60% scroll offset, no zoom); the text and all
following sections scroll normally. Other pages retain their brief title entrance. Route changes are immediate.
Selected pieces use a stable brand-interleaved order with no automatic changes. Left/right arrows page through
four products on desktop, two on tablet and one on mobile; touch scrolling and keyboard navigation are supported.
All disabled under `prefers-reduced-motion`.

## Header contact and company story

The desktop Contact us control has its label in the HTML and a width fitted to its text, with all button transitions
disabled. It opens booking and contact choices on mouse hover or click. At 1280px and below it is hidden; the
mobile menu lists Book an appointment and Contact us as two individual actions. There is no contact icon.
Escape and outside clicks close the desktop dropdown.

Contact opens the email address, then a themed name/subject/phone/email/message form, followed by the central
phone and showroom numbers, a showroom link and a booking option. The form validates locally and explicitly
sends nothing, as requested; it has no email-service or backend integration. Booking remains a demo too.

Our Story adapts the company overview from https://taf.com.cy/who-we-are and the dated archive from
https://taf.com.cy/our-history. The seven historical photographs live in content/history with multilingual
periods and captions, and are shown uncropped without enlargement. These archival family/event photographs
are the explicit exception to the usual room-set imagery rule.

## Alignment and navigation

- The header stays fixed in both scroll directions. It has a solid pale background after the first 64px of
  scrolling, including over hero photographs; pages without a hero start with that background. The scrolled
  header fades to opaque over 0.35 seconds, without a glass/blur effect. Sticky brand filters remain immediately below it.
- Section spacing uses shared `--section-space` and `--section-space-tight` tokens. The introductory paragraph is
  centred, and card captions consistently put the smaller brand/category line below the product name.
- Page headings can shrink within flex layouts; long translated headings fit mobile screens. The footer groups
  all brand names into two compact columns immediately to the left of Showrooms on desktop; they stack above
  Showrooms on smaller screens.
- Mobile booking and product dialogs fit the available page width, including the reserved scrollbar gutter.
  Booking content uses the same mobile side padding as the page, with a two-column showroom chooser.

## Copy & tone

- About TAF: a Cypriot family business since 1965 ("Furnishing homes since 1965", "Three generations").
- Brands described by **country** ("Italy · 1970", "Denmark · 1987"), not Italian regions.
- Navigation: Brands · Showrooms · Our Story · [EN | ΕΛ | РУ] · Book an appointment.
- Footer (black): logo, a compact two-column brand list, showrooms, TAF navigation and social in one row. All brands
  with a website link directly to it in a new tab, including brands that have internal product pages. Inside by
  TAF stays as plain text because no separate website is listed. Country labels and the separate large brand
  block are omitted to keep the footer compact.

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

The footer TAF column contains only Inspiration and Our Story. Email and the central phone remain in Contact us.

The product carousel uses the single heading Selected pieces (translated), without a repeated eyebrow or the former Cypriot homes phrase.

## Expanded brand catalogue — 8 November 2026

The owner requested the full TAF collection galleries. Fifteen brands now have product pages; Guerra Vanni
remains in the supplementary list because these galleries contain no attributed products for it. New brand
cover and feature images are selected from their imported photographs; existing pairs and the five-slide
landing sequence are preserved. Home and Brands automatically list every populated brand.

Only the home Makers we represent names were reduced to `clamp(26px, 2.6vw, 40px)`. Other brand titles,
footer links keep their existing type scales. Brand/category/name together
identify a product, so shared model names in different categories open the correct photograph.

The full collection import explicitly includes studio, portrait and lower-resolution product images from TAF.
Use room photographs for brand previews where available; Magniflex and Olivo & Groppo use the supplied
product photography. The original room-only rule still applies when choosing future editorial/landing imagery.

## Image quality review — 8 November 2026

Following the full collection import, the owner requested removal of low-quality images. A resolution and
sharpness scan, followed by visual review of borderline files, excluded 159 product images and nine
undersized cover/feature files. Active brand photos now have at least 1000 pixels on their longest edge;
new editorial imagery should still aim for 1600px or more. Smooth materials were not automatically
classified as blur. The catalogue now has 354 product photos across 14 brands with pages.

Cane-line, Connubia, Inside and Orme use clearer replacement cover/feature photos where needed.
Olivo & Groppo has no qualifying product photos, so it returns to the supplementary brand list and footer.
Inspiration photographs and the historical archive retain their original images.

Excluded originals are stored outside the active brand folders in `content/quality-excluded/` and are not
published or read by the build. `content/imports/quality-review-2026-11-08.json` records each exclusion,
its resolution and replacement previews. The collection import manifest was updated to follow relocated files.

## Latest image and brand refinements — 8 November 2026

The owner clarified that only genuinely blurry images should be excluded. The earlier fixed 1000px cutoff
was too strict: 147 clear smaller photographs have been restored, leaving 501 product photos across 15
brands with pages. Twelve visibly soft room/detail thumbnails remain outside the active folders. Keep
the clearer replacement previews; Olivo & Groppo has returned to the main brand list with its seating.

The scrolling brand-name strip is removed entirely. Makers follows the introductory statement with one
shared section gap; Selected pieces retains its manual product carousel. New brand biographies are
translated into English, Greek and Russian. Verified years populate the existing origin/year labels on
brand pages and in Makers, matching the established layout. Source links are in brand.json and
`docs/brand-sources.md`. Inside has a description but no invented founding year; the owner does not know
its launch date. Mistral is corrected to Italy (1987), and Connubia to its 2016 brand launch.

The home brand section and Brands page now use the single title Our Brands (translated), without a
repeated eyebrow. The supplementary showroom label and brand list align at the top, with no top padding
on the first list item.

## Product title cleanup — 8 November 2026

All 159 code/placeholder/raw-filename titles now have readable display names. Another 63 photo suffixes,
capitalisation issues and clear typos were cleaned up. Identifiable model/collection names are retained;
uncertain images use brand + a visually appropriate furniture/object type. Generic names are translated
into English, Greek and Russian in per-brand names.json files. No model identities are invented.

The build validates and includes these translated titles. Every user-facing product-name surface uses
the same title, while the original category/name identity remains internal. This preserves image, viewer
navigation and link matching when several photos share a generic or collection title. Product count and
images are unchanged. The minimal viewer layout is unchanged.
