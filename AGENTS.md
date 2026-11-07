# AGENTS.md — TAF website concept

Guide for AI coding agents (Codex, Claude Code, etc.) and humans picking up this project.
Read this first, then the files in `docs/` for detail.

| Doc | What it covers |
|---|---|
| [content/README.md](content/README.md) | How to add brands, products and inspiration projects (the manual workflow) |
| [docs/design.md](docs/design.md) | Visual system, page structure, the client's taste and decisions (fonts, hero, images) |
| [docs/history.md](docs/history.md) | Chronological log of what was tried, what was reverted, and fixes that failed — incl. the abandoned scrapers |
| [docs/publishing.md](docs/publishing.md) | How to commit, push and publish to GitHub (private repo `gianniszonia/taf-website`) |
| [README.md](README.md) | Short human-facing overview and run commands |

## What this is

A concept website for **Takis Angelides Furnihome (TAF)**, a Cypriot family furniture retailer (founded 1965,
four showrooms: Nicosia, Limassol, Larnaca, Paphos) that imports European brands. The live site is
https://taf.com.cy (Drupal, built by another agency) — this repo is an independent redesign demo, not that site.

Goals set by the client: simple, elegant, informational site; easy browsing of each brand's products;
"Book an appointment" as the main action; English / Greek / Russian; **content added manually** as photos in folders.

## Run it

Requirements: Node 20+ (tested on 20.14, Windows). One dependency: `sharp` (image processing). No Python needed.

```bash
npm install
npm run build   # content/ → site/img/{brands,inspiration}/*.webp + site/data/catalog.js  (after ANY content change)
npm start       # static server on http://localhost:5173   (scripts/serve.mjs, no deps)
```

`.claude/launch.json` defines the same server as `taf-demo` for Claude Code's preview pane.
No tests, no bundler, no framework: `site/` is plain HTML/CSS/JS served as-is.

## Publishing (GitHub)

The project lives in the **private** repo `https://github.com/gianniszonia/taf-website` (branch `main`).
To publish changes: `npm run build` → `git add -A` → review `git diff --cached --stat` → `git commit -m "…"` →
`git push`. Only push when the owner asks; never force-push `main`; never make the repo public or enable Pages
without being asked (brand image rights are not cleared). Generated files (`site/img/brands|inspiration`,
`site/data/catalog.js`, `node_modules`) are gitignored — rebuild after cloning. Full guide: [docs/publishing.md](docs/publishing.md).

## Content model (the important part)

**One photo = one product post.** There is no scraping and no product metadata beyond what the folder gives:

```
content/brands/<id>/<Category>/<Product name>.jpg   → product: name (file name), category (folder), brand (parent)
content/brands/<id>/brand.json                       → brand name, origin (country), founded, website, intro{en,el,ru}, speciality{en,el,ru}
content/brands/<id>/cover.jpg / feature.jpg          → brand hero + landing slideshow / home brand-list image
content/brands/<id>/links.json                       → optional { "Category/Name": "https://product-page" }
content/brands/order.json                            → brand order
content/inspiration/<Project title>/NN.jpg           → inspiration project (first photo = cover)
content/inspiration/order.json                       → project order (first 3 shown on the home page)
```

Clicking a product shows only: photo, product name, brand (link), category, **Book an appointment**, **Visit website**
(product link from `links.json`, else the brand website). This minimalism is deliberate — the client does not have
descriptions/designers/dimensions for all products, so none are shown for any. Do not add fields back without asking.

A brand with zero product photos has no page; it appears under "Also in our showrooms" and in the footer.
Full instructions for content editors: [content/README.md](content/README.md).

## Layout

```
content/                  SOURCE OF TRUTH (hand-maintained photos + small JSON files)
scripts/build.mjs         content/ → optimised images + site/data/catalog.js
scripts/serve.mjs         tiny static server
site/
  index.html              shell; loads data/content.js, data/i18n.js, data/catalog.js, js/app.js
  js/app.js               whole app: hash router, pages, i18n, hero slideshow, rotating picks, viewer, booking sheet
  css/styles.css          all styles (design tokens at top)
  data/content.js         showrooms, opening hours (from Google, Nov 2026), timeline — hand-edited
  data/i18n.js            ALL interface text in en / el / ru — hand-edited
  data/catalog.js         GENERATED — never edit by hand (gitignored)
  img/logos/              TAF logo (dark + white) and favicon; brand logos are intentionally NOT used
  img/brands/, img/inspiration/   GENERATED (gitignored)
```

## Routes (hash router in `site/js/app.js`)

`#/` home · `#/brands` · `#/brand/<id>` (`?c=<Category>` filter) · `#/inspiration` · `#/inspiration/<project-slug>` ·
`#/showrooms` · `#/story`. Legacy `#/houses`, `#/house/<id>` redirect. Unknown/empty brand → brands overview;
unknown project → inspiration overview.

Home sections: hero slideshow (brand covers) → statement → brand-name ticker → brand index with hover preview
(`feature` images) → **Selected pieces** (4 cards; one card cross-fades to another product every ~3.8 s, pool =
all products, brands interleaved, shuffled per visit; pauses on hover / when the viewer is open / tab hidden) →
inspiration teaser (first 3 projects) → appointment band → showrooms.

## Current content (2026-11-07)

| Brand | Products | Notes |
|---|---|---|
| Poliform | 14 | links.json from Poliform product pages |
| Calligaris | 12 | links.json |
| Porada | 12 | links.json |
| Natuzzi Italia | 8 | TAF's own photos (natuzzi.com cannot be scraped) |
| Natuzzi Editions | 6 | TAF's own photos |
| 11 others (Cane-line, Connubia, Noctis, Magniflex, Orme, Mistral, Home Cucine, Fantoni, Olivo & Groppo, Guerra Vanni, Inside) | 0 | brand.json only |

14 inspiration projects (4–12 photos each), curated from https://taf.com.cy/inspiration (TAF's own work).
Products were kept only if their single photo is a wide (≥1200 px, ratio 1.25–2.2), non-close-up room shot;
eight close-up/odd products were removed by eye for consistency.

## Hard rules (do not break)

1. **No scraping.** Partner-site scrapers were built, partly worked, and were removed at the client's request
   (see docs/history.md). Content is added by hand to `content/`. If automation is ever wanted again, ask partners
   for official feeds/media kits; never spoof a browser User-Agent or evade bot protection.
2. **`content/` is the source of truth; `site/data/catalog.js`, `site/img/brands/`, `site/img/inspiration/` are build output.**
3. **One image style site-wide:** room-set photography, landscape, consistent. No studio cut-outs, no close-ups,
   no brand logos. The client explicitly asked for consistency ("keep the best images").
4. **Every user-visible string must exist in en, el and ru** (`site/data/i18n.js`; brand texts in `brand.json`).
   Fonts must support Latin + Greek + Cyrillic.
5. **Do not lean on "Italian".** Not all brands are Italian (Cane-line = Denmark, Mistral = Spain, Inside = Cyprus).
   Copy is about TAF. Never use "L'arte di abitare" (a real company's name).
6. The booking form is a **demo**: validates and confirms, sends nothing. Keep the "Demonstration only" note.
7. Keep the product viewer minimal (see Content model).

## Verifying changes (what has worked)

- `npm run build`, then check `#/`, `#/brands`, `#/brand/poliform`, `#/inspiration`, `#/inspiration/nordic-spirit`,
  `#/showrooms`, `#/story` in all three languages, at ~1920×1031, 1366×768 and 375×812.
- From the browser console, HEAD-request every `img` src and every image in `TAF_CATALOG` (brands + inspiration).
- Test the rotating picks over ~15 s: one card changes at a time, no card stays faded (`.card.swap`), and clicking a
  card opens the product shown on it.
- **Claude Code's preview pane is often hidden**: IntersectionObserver/lazy images are throttled, image decoding can
  stall and screenshots lag one frame. `app.js` has a reveal fallback and the picks rotation has a 1.5 s timeout for
  that reason. When screenshotting, force-load images and add `.in` to `.rv, .wipe, .card`, or measure with JS.
- Hero title clipping: measure glyph bottoms vs `.line-mask` bottoms with a `Range`, after the reveal (~2.5 s).
- Deleting files from Bash: the harness blocks `rm` on a bare `"$var/..."`; use `"${var:?}"` or literal paths.

## Client preferences (from feedback so far)

Simplicity, elegance, consistency; few subtle animations (wipe reveals, gentle parallax, slow brand ticker, 0.9 s
hero cross-fade, **no zoom on hero images**, picks rotation); hero title "Furnishing homes since 1965." in
**Noto Serif Display, weight 330** (400 was too heavy, Manrope sans rejected); darker scrim on bright photos;
"Book an appointment" top-right; visible language switch; footer lists **all** brands; no footer tagline.
Details in [docs/design.md](docs/design.md).
