# TAF website — concept

A simple, elegant website concept for [taf.com.cy](https://taf.com.cy) (Takis Angelides Furnihome).
English / Ελληνικά / Русский, brands and products, inspiration projects, live showroom opening status,
and "Book an appointment".

**Live demo:** https://gianniszonia.github.io/taf-website/ (concept — not the official TAF website)

> **Working on this project (human or AI agent)?** Start with [AGENTS.md](AGENTS.md) — architecture, rules,
> current status — then [content/README.md](content/README.md) (adding content), [docs/design.md](docs/design.md)
> (design decisions) and [docs/history.md](docs/history.md) (what was tried and what failed).

## Run

```bash
npm install
npm run build   # content/ → optimised images + site/data/catalog.js
npm start       # http://localhost:5173
```

After cloning from GitHub, `npm install && npm run build` regenerates the optimised images (they are not committed).
Publishing changes to GitHub: see [docs/publishing.md](docs/publishing.md).

## Adding content

Everything is photos in folders — see [content/README.md](content/README.md):

- **Product:** `content/brands/<brand>/<Category>/<Product name>.jpg` — one photo = one product post.
- **Inspiration project:** `content/inspiration/<Project title>/01.jpg, 02.jpg …`

Then run `npm run build`.

## Site structure

| Page | What it does |
|---|---|
| Home | Hero slideshow, statement, brand list with hover preview, rotating "Selected pieces", inspiration teaser, appointment band, showrooms |
| Brands | One large image per brand + the other brands TAF carries |
| Brand page | Hero, intro, product grid with category tabs; clicking a product shows its photo, brand, category, *Book an appointment* and *Visit website* |
| Inspiration | Homes furnished by TAF; each project has a photo gallery |
| Showrooms | Four cities, addresses, phones, Google opening hours with live open/closed status, directions |
| Our Story | Company history and milestones |

## Notes

- The appointment form is a demo: it validates and confirms, but sends nothing.
- Before going live, confirm with each brand that its images may be used — most offer dealer media kits.
