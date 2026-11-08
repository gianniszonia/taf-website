# Where to add images

Every photograph on the website comes from this `content/` folder. Put the original file in the right place, list it where this guide says, then run `npm run build`. The build makes the web-sized copies in `site/img/`. Never put images in `site/img/` by hand.

## Quick map

| You want to add… | Put the file in… | Then also… |
| --- | --- | --- |
| A product photo for a brand | `content/brands/<brand-id>/<Category>/<Product name>.jpg` | Add `"<Category>/<Product name>"` to that brand's list in `content/editorial-selection.json` |
| A brand's main (hero) photo | `content/brands/<brand-id>/cover.jpg` | Nothing |
| A brand's photo for the homepage "Our Brands" section | `content/brands/<brand-id>/feature.jpg` | Nothing |
| A new inspiration project | `content/inspiration/<Project Title>/01.jpg, 02.jpg, …` | Add `project.json` in the same folder, and the folder name to `content/inspiration/order.json` |
| More photos for an existing project | Same project folder, next number (`10.jpg`, `11.jpg` …) | Nothing |
| A historical photo for Our Story | `content/history/08.jpg` (next number) | Add an entry to `content/history/history.json` |
| A photo in the homepage "Selected pieces" | It must already be a published product | Add `{ "brand", "category", "name" }` to `content/selected-pieces.json` |

`<brand-id>` is the brand's folder name: `natuzzi-italia`, `natuzzi-editions`, `poliform`, `porada`, `calligaris`, `cane-line`, `connubia`, `fantoni`, `guerra-vanni`, `home-cucine`, `inside`, `magniflex`, `mistral`, `noctis`, `olivo-groppo` or `orme`.

## What a photo must be

- **At least 1600px wide.** Smaller photos are skipped by the build and listed at the end of its output. Full-screen roles (`cover.jpg`, `feature.jpg`, and the first photo of an inspiration project) look best at 2400px or wider.
- **Landscape.** Product cards, brand photos and the mosaic crop to landscape frames, so keep the subject away from the very edges.
- **A real room, not a studio cut-out on white.** Photos should be sharp and well lit, and give the feel of a finished home. Archive photos for Our Story are the exception.
- **JPG, PNG or WebP.** Use the highest-quality original you have. The build makes optimised copies.

## Brand products (step by step)

1. **Choose the category folder.** Use an existing folder name exactly, for example `Sofas`, `Armchairs`, `Beds`, `Dining Tables`, `Dining Chairs`, `Coffee & Side Tables`, `TV Units & Wall Systems`, `Sideboards`, `Kitchens`, `Wardrobes`, `Office Desks`, `Outdoor` or `Kids`. The full list is `CATEGORIES` in `scripts/build.mjs`. A brand-new category also needs its name translated in `site/data/i18n.js` (under `cat`, in `en`, `el` and `ru`).
2. **Name the file after the product:** `Sofas/Sydney.jpg`. The name (without extension) is the product's permanent ID. **One photo = one product.** For a second photo of the same model, use a distinct name such as `Sydney - 2.jpg`.
3. **Approve it.** Add `"Sofas/Sydney"` (no extension) to the brand's list in `content/editorial-selection.json`. Only listed photos are published.
4. **Optional display name.** If the file name isn't the name visitors should see, add it in Greek and Russian too, in the brand's `names.json`:
   ```json
   { "Sofas/Bellport - 2": { "en": "Bellport", "el": "Bellport", "ru": "Bellport" } }
   ```
5. **Optional product link.** Add the product's own web page in `links.json`; otherwise the brand website is used:
   ```json
   { "Beds/Dream": "https://www.poliform.it/en/products/dream-beds/" }
   ```
6. **Build:** run `npm run build` and check the product appears on its brand page and on the Products page, which lists every approved product automatically, filterable by category and brand.

To **remove** a product, delete its photo and its entries in `editorial-selection.json`, `names.json`, `links.json` and `selected-pieces.json`. The build stops with an error if an approved photo is missing.

## A brand that is only a website link today

`cane-line`, `connubia`, `guerra-vanni`, `inside`, `magniflex`, `mistral` and `olivo-groppo` have no photos yet. They appear as outside links. To give one a gallery, add product photos as above (plus ideally `cover.jpg` and `feature.jpg`). Once at least one photo is approved, the brand gets its own page automatically. Without `cover.jpg` and `feature.jpg`, the build uses the brand's largest product photos.

## Inspiration projects

- **Folder:** create `content/inspiration/<Project Title>/`. The folder name is the title shown on the site.
- **Photos:** number them `01.jpg`, `02.jpg` … in the order they should appear. The first one is the cover and the full-screen photo, so make it the strongest.
- **`project.json`:** add the text in all three languages. Each language is a list of paragraphs; `collaboration` is only needed when an architect is credited:
  ```json
  {
    "source": "https://taf.com.cy/…",
    "description": { "en": ["…"], "el": ["…"], "ru": ["…"] },
    "collaboration": { "name": "Christia Angelidou Architects", "url": "https://…" }
  }
  ```
  Brand names written in the English description (e.g. "The kitchen is by Poliform") automatically show a "Brands in this project" row.
- **Order:** add the folder name to `content/inspiration/order.json`. The first project in the list is the one featured full screen on the Inspiration page, and the first three appear on the homepage.
- **Minimum:** a project needs at least three photos of 1600px or more, or it isn't published.

## Our Story archive

- **Photo:** put it in `content/history/` with the next number.
- **`history.json`:** add an entry with the period and caption in all three languages:
  ```json
  { "file": "08.jpg", "period": { "en": "…", "el": "…", "ru": "…" }, "caption": { "en": "…", "el": "…", "ru": "…" }, "source": "…" }
  ```
- **Size:** archive photos are exempt from the "room, landscape" rule, but still need to be sharp.

## Homepage photos

- **Hero slideshow:** shows the `cover.jpg` of the brands listed in `heroHouses` near the top of `site/js/app.js`. Change a slide by replacing that brand's `cover.jpg`.
- **"Our Brands" section:** shows each brand's `feature.jpg`.
- **"Selected pieces":** shows 12 random photos from `content/selected-pieces.json`. Each entry must be an approved product. Keep at least 20 entries so there are always 12 that differ from the rest of the homepage.

## Not for publication

- **`content/collection-review/`:** carpet and curtain photos waiting for brand attribution. They are never published. Once a brand is confirmed and the photo approved, move it into that brand's category folder and follow the product steps above.
- **Archive of removed photos:** low-resolution originals were moved to the `TAF Website - archive` folder next to this project, not into the project.
