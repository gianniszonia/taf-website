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
    Sofas/                       ← one folder per category
      Bristol.jpg                ← ONE photo = ONE product post. File name = product name on the site
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

**Categories** — use these folder names so the filters are the same for every brand (they are translated
automatically): `Sofas`, `Armchairs`, `Tables`, `Chairs`, `Beds`, `Storage`, `Kitchens`, `Outdoor`, `Accessories`.
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
```

## Photo rules (keep the site consistent)

1. **Room-set photos only** — the furniture in a real, styled room. No cut-outs on white, no close-ups of
   fabric/legs, no bathrooms or empty corridors.
2. **Landscape** (wider than tall, roughly 4:3 to 16:9), **at least 1600 px wide**, sharp and well lit.
   Product photos are shown cropped to 4:3, so keep the furniture near the centre.
3. **One photo per product.** Pick the best one.
4. `cover.jpg` should be ≥ 2000 px wide and work with white text on the left side.
5. JPG is fine; the build converts everything to optimised WebP.
