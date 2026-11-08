# Content folder — how to add products and projects

Everything the website shows about brands, products and inspiration comes from this folder.
Add or change files here, then run `npm run build` (and refresh the site).

## Brands and products

```
content/brands/
  order.json                     ← order of brands on the site, e.g. ["natuzzi-italia", "poliform", …]
  poliform/                      ← one folder per brand (short id, lowercase)
    brand.json                   ← name, country, year, website, intro text (EN / EL / RU)
    cover.jpg                    ← big image: landing slideshow + top of the brand page
    feature.jpg                  ← image shown in the brand list on the home page (use a different photo)
    links.json                   ← optional: product web pages (see below)
    names.json                   ← optional: display names in EN / EL / RU
    Sofas/                       ← one folder per category
      Bristol.jpg                ← ONE photo = ONE product post. File name = default product title
      Westside.jpg
    Armchairs/
      Le Club.jpg
    Tables/ …
```

**To add a product:** drop a photo into the right category folder and name it after the product
(`Sofas/Bristol.jpg`). That's it — `npm run build`.

**To remove a product:** delete its photo.

**To link a product to its page on the brand's website**, add a line to `links.json`:

```json
{
  "Sofas/Bristol": "https://www.poliform.it/en/products/bristol-sofas/",
  "Armchairs/Le Club": "https://www.poliform.it/en/products/le-club-armchairs/"
}
```

Products without a link use the brand's website for the "Visit website" button.

**Categories** — use these folder names so the filters are the same for every brand (translated automatically):
`Sofas`, `Armchairs`, `Coffee & Side Tables`, `TV Units & Wall Systems`, `Dining Chairs`, `Dining Tables`,
`Sideboards`, `Stools`, `Beds`, `Kids`, `Mattresses`, `Office Chairs`, `Office Desks`, `Kitchens`, `Wardrobes`,
`Outdoor`, `Art`, `Carpets`, `Curtains`, `Decoration`. Older `Tables`, `Chairs`, `Storage` and `Accessories`
remain supported, but existing products have been moved to the more specific categories.
Another name still works, but it will not be translated.

**A new brand:** create `content/brands/<id>/brand.json` (copy an existing one), add its id to `order.json`.
A brand with no product photos is listed under "Also in our showrooms" and in the footer, without its own page.

`brand.json`:

```json
{
  "name": "Poliform",
  "origin": "Italy",
  "founded": 1970,
  "website": "https://www.poliform.it",
  "intro": { "en": "…", "el": "…", "ru": "…" },
  "speciality": { "en": "…", "el": "…", "ru": "…" }
}
```

(`speciality` is only shown for brands without their own page, e.g. "outdoor living".)
Countries are translated for `Italy`, `Denmark`, `Spain`, `Cyprus` (add more in `site/data/i18n.js` → `country`).

## Inspiration projects

```
content/inspiration/
  order.json                     ← order of projects (folder names); first three appear on the home page
  Nordic Spirit/                 ← folder name = project title on the site
    01.jpg                       ← first photo = project cover (use a wide room shot)
    02.jpg …
    project.json                 ← project description and optional architect credit
```

`project.json` keeps the editorial details beside the project's photographs. `description` contains an array of
paragraphs in each language (`en`, `el`, `ru`); `source` records the original TAF project URL. An optional
`collaboration` object has `name` and `url` fields and appears as a linked credit below the description.
Add that credit only when the source project mentions the collaborator. The existing 14 descriptions are
adapted from TAF's project pages, with Greek and Russian translations; they are maintained manually, without a scraper.
Run `npm run build` after editing the metadata, just as after changing photos.

## Company history archive

`content/history/01.jpg` through `07.jpg` are the archive photographs requested from TAF's Our History page.
`content/history/history.json` records their file names, periods and captions in English, Greek and Russian,
plus the source page. The build creates `site/img/history/*.webp` and the catalogue's `history` entries.
Edit these source files manually and run `npm run build`. Archive photographs are intentionally preserved at
their natural proportions; this historical section is the exception to the room-set-only photography rule.

## Photo rules (keep the site consistent)

1. **Room-set photos only** — the furniture in a real, styled room. No cut-outs on white, no close-ups of
   fabric/legs, no bathrooms or empty corridors.
2. **Landscape** (wider than tall, roughly 4:3 to 16:9), **at least 1600 px wide**, sharp and well lit.
   Product photos are shown cropped to 4:3, so keep the furniture near the centre.
3. **One photo per product.** Pick the best one.
4. `cover.jpg` should be ≥ 2000 px wide and work with white text on the left side.
5. JPG is fine; the build converts everything to optimised WebP.

## TAF collection import — 8 November 2026

The owner explicitly requested a one-time import of all photographs from TAF’s 20 collection galleries,
including the source’s studio shots, close-ups and smaller images. Those product photographs are an
exception to the earlier room-set-only selection; the curated landing slideshow remains unchanged.
No recurring importer or partner-site scraper is installed. Continue maintaining photos manually.

The import added 461 photographs, skipped 18 matching photographs (including resized/recompressed copies),
and placed 22 unverified photographs in `content/collection-review/`. These review photos are not published.
`content/imports/taf-collection-2026-11-08.json` records every source page, original filename, URL, attribution,
local file and duplicate decision. Existing photos were retained; different photographs of the same model
remain separate posts, with a numeric suffix when needed. Original filenames without a verified model name
retain descriptive names or codes rather than invented product names.

Brand attribution follows the gallery brand section, with aliases for Fantoni, Olivo & Groppo and Inside.
Mixed sideboards and explicitly named Calligaris décor use the brand in the source filename. Unlabelled
carpets and curtains stay in review unless the filename explicitly identifies the brand.

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

## Current image policy — clarification on 8 November 2026

The owner clarified that only really blurry images should be excluded. The previous 1000px cutoff is
retired: a smaller but sharp photo is acceptable. After visual review, 147 images were restored, bringing
the catalogue to 501 product photos across 15 brands with pages. Twelve soft thumbnails remain excluded.
The quality audit records which earlier exclusions were restored; the import manifest follows the files.
Retain the clearer replacement covers rather than reverting them to small thumbnails. Brand biographies,
verified years and research sources are maintained in brand.json; all biographies have three languages.

## Readable product names

Keep original imported filenames as stable identifiers. When a source name is a code, photo number or
unhelpful filename, add a translated title to `content/brands/<brand>/names.json` instead of exposing it
as the heading. Keys are the category and exact source filename without its extension, as with links.json:

```json
{
  "Wardrobes/1": {
    "en": "Poliform wardrobe",
    "el": "Poliform ντουλάπα",
    "ru": "Poliform шкаф"
  }
}
```

Use an identifiable model or collection name when the source supports it. Otherwise use the brand and
a plain furniture/object type, as requested by the owner. Do not invent a model name. All three language
values are required; a proper model name can be identical in each language. If no override exists, the
filename remains the default title. Rebuild after edits.

The November 2026 cleanup supplies readable titles for all 159 flagged posts, plus 63 filename suffixes,
capitalisation issues and clear spelling errors. Cards, photo alt text, the product viewer and booking
notes use the translated title. Internal source keys, image paths and product links remain unchanged,
so posts with the same visible title still open their own photograph. The title audit and supporting
model-name sources are in `content/imports/product-names-2026-11-08.json`.
