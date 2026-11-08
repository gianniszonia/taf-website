# Website content

This folder is the single source of truth for everything the website shows: photographs, brand texts, projects and history. Edit here, run `npm run build`, then refresh the browser. Never edit the generated `site/img/` folders or `site/data/catalog.js`.

**Adding or replacing photos:** see [ADDING-IMAGES.md](ADDING-IMAGES.md).

## Layout

```
content/
├── ADDING-IMAGES.md          where every kind of photo goes (start here)
├── editorial-selection.json  publication allowlist: approved product photos per brand
├── selected-pieces.json      pool for the homepage "Selected pieces" (12 drawn per visit)
├── brands/
│   ├── order.json            brand display order (ids); unlisted brands follow alphabetically
│   └── <brand-id>/
│       ├── brand.json        name, origin, founded, website, intro{en,el,ru}, speciality{en,el,ru}
│       ├── cover.jpg         brand page hero (+ homepage slideshow for selected brands)
│       ├── feature.jpg       homepage "Our Brands" photo
│       ├── names.json        optional display titles  { "Category/File": {en,el,ru} }
│       ├── links.json        optional product web pages { "Category/File": "https://…" }
│       └── <Category>/<Product>.jpg   one photo = one product
├── inspiration/
│   ├── order.json            project order; the first is featured on the Inspiration page
│   └── <Project Title>/01.jpg … + project.json (description{en,el,ru}, source, collaboration?)
├── history/                  Our Story archive: NN.jpg + history.json
└── collection-review/        unattributed carpets/curtains kept at the owner's request; never published
```

## Text rules

- **Three languages.** Every visitor-facing text has `en`, `el` and `ru`: brand intros, product display names, project descriptions and history captions.
- **Brand pages** show `intro`; `speciality` is a short tag used only as a fallback.
- **`founded`** is `null` when no year can be verified (Inside by TAF). Never guess a year. Research sources are listed in [docs/provenance/brand-sources.md](../docs/provenance/brand-sources.md).
- **Product names:** use verified model names; otherwise "brand + furniture type". Never show opaque supplier codes; give them a display name in `names.json`.
- **No invented details.** Don't invent descriptions, designers or specifications. The product viewer shows only photo, name, brand, category, "Book an appointment" and the official website.
- **Architect credits:** keep `collaboration` (name and link) wherever the original project credited an architect.

## How the build decides what is published

- **Products:** a product appears only if it is listed in `editorial-selection.json` **and** its photo is at least 1600px wide.
- **Brand galleries:** a brand with no published products is shown as an outside link only.
- **Inspiration projects:** a project needs at least three photos of 1600px or more.
- **Skipped photos:** the build prints everything it skipped, with each photo's width. Fix or replace those photos rather than ignoring the list.

Source provenance (the owner-authorized 2026 imports from taf.com.cy) lives in [docs/provenance/](../docs/provenance/). It is historical record, not a workflow; no scraping.
