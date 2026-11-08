# TAF website — guide for agents and contributors

Independent redesign demo for Takis Angelides Furnihome (founded 1965). The original agency site is https://taf.com.cy; this project is a separate static site. The aim is quiet luxury: big, sharp room photography, very little text, and an appointment offered as a service, never pushed.

Read before changing anything:
- [content/ADDING-IMAGES.md](content/ADDING-IMAGES.md): where photos go.
- [content/README.md](content/README.md): content folders and text rules.
- [docs/design.md](docs/design.md): current design, page by page.
- [docs/history.md](docs/history.md): earlier attempts and client feedback. Check it before reversing a decision.
- [docs/publishing.md](docs/publishing.md): deployment.

## Run and structure

Node 20+. `npm ci`, `npm run build` (can take several minutes), `npm start` → http://localhost:5173. `.claude/launch.json` defines this server as `taf-demo`. There is no framework, bundler or test runner; Sharp is the only dependency.

| Path | What it is |
| --- | --- |
| `content/` | Source of truth: photographs, brand/project/history JSON, allowlists |
| `scripts/build.mjs` | Builds `site/img/{brands,inspiration,history}/` and `site/data/catalog.js`; skips photos under 1600px |
| `scripts/serve.mjs` | Dependency-free static server for `site/` |
| `site/index.html` | Page shell, fonts, header |
| `site/js/app.js` | All pages (`P.*`), router, viewer, appointment and contact forms |
| `site/css/styles.css` | One stylesheet: tokens, sections, responsive rules, motion |
| `site/data/content.js` | Showrooms, opening hours, contacts, social links |
| `site/data/i18n.js` | Interface text in en/el/ru |
| `site/img/logos/` | Logos and favicon (hand-maintained) |
| `docs/` | Design, history, publishing; `docs/provenance/` holds sources and 2026 import records |

Generated output (`site/img/brands|inspiration|history/`, `site/data/catalog.js`) is gitignored. Never edit it by hand; rebuild instead. Keep temporary helpers (mock-ups, scripts, servers) outside the project. Low-resolution originals that were removed live in `../TAF Website - archive/`, not in the project.

## Current content (8 November 2026)

- **Brands:** 16 in total, 9 with galleries. The other 7 (`cane-line`, `connubia`, `guerra-vanni`, `inside`, `magniflex`, `mistral`, `olivo-groppo`) appear as outside links.
- **Photos:** 89 products, 20 inspiration projects and 7 archive photos.
- **Selected pieces:** `content/selected-pieces.json` holds 55 entries. The homepage draws 12 per page load, excluding photos already used elsewhere on the homepage.
- **Publication allowlist:** `content/editorial-selection.json`. The build also requires each photo to be at least 1600px wide.
- **Not published:** `content/collection-review/` holds unattributed carpets and curtains kept at the owner's request.

## Routes

`#/`, `#/products` (`?c=<Category>,…&b=<brand-id>,…`), `#/brands`, `#/brand/<id>` (`?c=<Category>` filter), `#/inspiration`, `#/inspiration/<slug>`, `#/showrooms`, `#/story`, `#/appointment` (`?store=`, `?interest=`, `?piece=`) and `#/contact`. Legacy `#/house…` routes redirect, and unknown items fall back to their index.

## Decisions to keep

**Pages and flow**
- **Section links:** the Selected pieces heading has its counter and arrows just after the title, and "All products" at the far right. Links to the Showrooms page from the homepage and the contact page read "View showrooms".
- **Home order:** full-screen hero → story statement with scroll-triggered counters → full-bleed Our Brands photo with hoverable names → Selected pieces (two large cards per view) → three inspiration projects → showrooms → invitation photo with "Book an appointment".
- **Appointment:** booking is its own calm page, reached only by choice. Never put it in a modal, drawer or pop-up, and never in the hero. Contact is its own page too.
- **One destination, one name:** every link to the appointment page reads "Book an appointment" and every link to contact reads "Contact us". Page titles match the menu: Our Brands, Products, Inspiration, Showrooms, Our Story. Brand and product websites are both "Official website", in the same ink colour as "Book an appointment" (no greyed-out secondary links).
- **Header:** Collection · Inspiration · Showrooms · Our Story, then the language switch (kept clearly readable at the client's request) and plain links to the two pages. "Collection" opens a panel aligned under its button: all 16 brands (those without a page open their official website, marked ↗), then product categories (two columns each), and a rotating brand photo captioned "New in <brand>" that reaches the right edge of "Contact us" and ends level with the last list item, on hover, click or keyboard; Escape closes it and the header turns solid while it is open. Below 1360px there is no Collection panel: the menu button opens a list with Our Brands and Products as separate items.
- **Products page:** every published piece. On wide screens, category and brand filters sit in a sticky left sidebar with no inner scrollbar: when it is taller than the screen it scrolls with the page until its last option shows. Each list is ordered by size, showing the top six plus "Show N more". The chosen option always stays visible, counts follow the other filter, and empty options are disabled. Below 1080px the filters move above the products as two scrollable rows of chips, and empty options are hidden. Several categories and several brands can be chosen at once (clicking a chosen option unselects it; "All" clears the group); results match any chosen brand and any chosen category. Filters live in the URL as comma lists (`?c=Sofas,Beds&b=poliform,orme`) and update in place. Cards open the usual product viewer.
- **Inspiration:** the first project is shown full screen, then a mosaic built from blocks that always fill whole rows (no gaps). On desktop, hovering a tile fades through more of its photos. Project pages show the description and architect credit above the photos, always open, and list "Brands in this project" from their own description.
- **Product viewer:** photo, title, brand, category, "Book an appointment" and the official website only. Viewer arrows are dark on light buttons, visible on any photo.

**Design**
- **Typography:** Noto Serif Display for headings (hero at most 80px; the client found larger "too heavy"), Manrope for body text. Headings use balanced line breaks, so no single word sits alone.
- **Motion:** slow hero zoom and cross-fades, quiet scroll reveals, slight image zoom on hover. Respect reduced-motion settings.
- **Images in code:** render photos with `photo(image, alt, SIZES.x)` so every size is offered (`srcset`). The build records the widths, and only photos at least 1600px wide are published.
- **Photography:** sharp room settings only, never studio cut-outs. Archive photos and complete inspiration galleries are the exceptions. Our Story has no appointment invitation.

## Hard rules

1. **Content is maintained by hand.** No scrapers, spoofed user agents or bot-protection evasion. The 2026 imports are provenance, not a workflow.
2. **Three languages.** Every interface text and visitor-facing description exists in English, Greek and Russian. Never invent founding years (Inside by TAF has none), product specifications or designers.
3. **Architect credits.** Keep them, with their links, wherever the original project credited them.
4. **Demo settings.** Keep the demo notices, `noindex, nofollow` and relative asset URLs. Forms must send nothing.
5. **Owner-only actions.** Commit, push or publish only when the owner asks, and never force-push. GitHub Pages builds `site/` from `main` in the public repository `gianniszonia/taf-website`.

## Verification

- **Build and syntax:** run `npm run build`; it must show no new skipped photos unless intended. Syntax-check changed JavaScript with `node --check`.
- **Pages to check:** home, Products (filters and Show more), the Collection menu, brands index and a brand page, inspiration index and a project, showrooms, story, appointment and contact.
- **Languages and widths:** EN/EL/RU at desktop (including about 1366px for the Russian header), tablet and phone widths.
- **Behaviour:**
  - no sideways overflow;
  - Back/Forward restores scroll position;
  - all 12 Selected pieces are reachable;
  - the forms send nothing;
  - reduced motion still works.
- **Use a visible browser.** Hidden preview panes slow down lazy images and scroll observers, which can look like a bug when it isn't.
