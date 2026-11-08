// Builds the website's catalogue from the hand-maintained content/ folder.
//
//   content/brands/order.json                 brand display order (ids)
//   content/brands/<id>/brand.json            name, origin, founded, website, intro{en,el,ru}, speciality{en,el,ru}
//   content/brands/<id>/cover.jpg             brand hero + landing slideshow   (optional)
//   content/brands/<id>/feature.jpg           photo for the home brand list    (optional)
//   content/brands/<id>/links.json            { "Sofas/Bristol": "https://…" } product web pages (optional)
//   content/brands/<id>/names.json            { "Category/Source name": { en, el, ru } } display titles (optional)
//   content/brands/<id>/<Category>/<Product name>.jpg     one photo = one product post
//
//   content/inspiration/order.json            project display order (folder names, optional)
//   content/inspiration/<Project title>/*.jpg project photos (first = cover)
//   content/inspiration/<Project title>/project.json description{en,el,ru}, source, optional collaboration
//
// Writes optimised WebP images to site/img/ and data to site/data/catalog.js.
import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const BRANDS = path.join(ROOT, 'content/brands');
const INSPIRATION = path.join(ROOT, 'content/inspiration');
const SITE = path.join(ROOT, 'site');
const IMG = /\.(jpe?g|png|webp|avif|tiff?)$/i;
// shared category folder names (anything else still works, it is just sorted last)
const CATEGORIES = ['Sofas', 'Armchairs', 'Coffee & Side Tables', 'TV Units & Wall Systems', 'Dining Chairs', 'Dining Tables', 'Sideboards', 'Stools', 'Beds', 'Kids', 'Mattresses', 'Office Chairs', 'Office Desks', 'Kitchens', 'Wardrobes', 'Outdoor', 'Art', 'Carpets', 'Curtains', 'Decoration', 'Tables', 'Chairs', 'Storage', 'Accessories'];

const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
const readJSON = async (p, d = null) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return d; } };
const ls = async (p) => readdir(p, { withFileTypes: true }).catch(() => []);
const dirs = async (p) => (await ls(p)).filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => d.name);
const images = async (p) => (await ls(p)).filter((d) => d.isFile() && IMG.test(d.name)).map((d) => d.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const rel = (f) => path.relative(SITE, f).replace(/\\/g, '/');
const byOrder = (order, key) => (a, b) => (order.indexOf(key(a)) + 1 || 999) - (order.indexOf(key(b)) + 1 || 999) || key(a).localeCompare(key(b));
let photos = 0;

async function render(src, base, sizes) {
  const out = {};
  for (const [k, o] of Object.entries(sizes)) {
    const file = `${base}-${k}.webp`;
    let img = sharp(src).rotate();
    img = o.crop ? img.resize({ width: o.w, height: o.crop, fit: 'cover', position: 'attention' }) : img.resize({ width: o.w, withoutEnlargement: true });
    const info = await img.webp({ quality: o.q || 80 }).toFile(file);
    out[k] = rel(file);
    if (!o.crop) { out.w = info.width; out.h = info.height; }
  }
  photos++;
  return out;
}
const CARD = { card: { w: 720, crop: 540, q: 78 }, lg: { w: 1800, q: 82 } };
const WIDE = { sm: { w: 1200, q: 84 }, lg: { w: 2400, q: 88 } };
const GALLERY = { sm: { w: 900, q: 80 }, lg: { w: 2000, q: 84 } };

// ---------- brands ----------
await rm(path.join(SITE, 'img/brands'), { recursive: true, force: true });
const brandOrder = await readJSON(path.join(BRANDS, 'order.json'), []);
const brands = [];
for (const id of await dirs(BRANDS)) {
  const dir = path.join(BRANDS, id);
  const meta = await readJSON(path.join(dir, 'brand.json'));
  if (!meta) { console.warn(`! ${id}: no brand.json — skipped`); continue; }
  const out = path.join(SITE, 'img/brands', id);
  await mkdir(out, { recursive: true });
  const links = await readJSON(path.join(dir, 'links.json'), {});
  const names = await readJSON(path.join(dir, 'names.json'), {});
  const products = [];
  for (const cat of (await dirs(dir)).sort(byOrder(CATEGORIES, (c) => c))) {
    for (const f of await images(path.join(dir, cat))) {
      const name = f.replace(IMG, '').trim();
      const title = names[`${cat}/${name}`] || null;
      if (title && ['en', 'el', 'ru'].some((lang) => typeof title[lang] !== 'string' || !title[lang].trim())) {
        throw new Error(`${id}/${cat}/${name}: display names must contain en, el and ru`);
      }
      products.push({ name, title, category: cat, img: await render(path.join(dir, cat, f), path.join(out, `${slug(cat)}-${slug(name)}`), CARD), url: links[`${cat}/${name}`] || '' });
    }
  }
  const top = await images(dir);
  const cover = top.find((f) => /^cover\./i.test(f));
  const feature = top.find((f) => /^feature\./i.test(f));
  const fallback = products[0] ? { sm: products[0].img.lg, lg: products[0].img.lg } : null;
  brands.push({
    id, name: meta.name, origin: meta.origin || '', founded: meta.founded || null, website: meta.website || '',
    intro: meta.intro || null, speciality: meta.speciality || null,
    featured: products.length > 0,
    cover: cover ? await render(path.join(dir, cover), path.join(out, 'cover'), WIDE) : fallback,
    feature: feature ? await render(path.join(dir, feature), path.join(out, 'feature'), WIDE) : fallback,
    products,
  });
  console.log(`${id.padEnd(18)} ${String(products.length).padStart(3)} products`);
}
brands.sort(byOrder(brandOrder, (b) => b.id));

// ---------- inspiration ----------
await rm(path.join(SITE, 'img/inspiration'), { recursive: true, force: true });
const inspOrder = await readJSON(path.join(INSPIRATION, 'order.json'), []);
const inspiration = [];
for (const title of (await dirs(INSPIRATION)).sort(byOrder(inspOrder, (t) => t))) {
  const meta = await readJSON(path.join(INSPIRATION, title, 'project.json'), {});
  if (meta.description && ['en', 'el', 'ru'].some((lang) => !Array.isArray(meta.description[lang]) || !meta.description[lang].length)) {
    throw new Error(`${title}: project description must contain paragraphs in en, el and ru`);
  }
  const files = await images(path.join(INSPIRATION, title));
  if (!files.length) continue;
  const out = path.join(SITE, 'img/inspiration', slug(title));
  await mkdir(out, { recursive: true });
  const imgs = [];
  for (const [i, f] of files.entries()) imgs.push(await render(path.join(INSPIRATION, title, f), path.join(out, String(i + 1).padStart(2, '0')), GALLERY));
  inspiration.push({ id: slug(title), title, description: meta.description || null, collaboration: meta.collaboration || null,
    source: meta.source || '', cover: await render(path.join(INSPIRATION, title, files[0]), path.join(out, 'cover'), WIDE), images: imgs });
  console.log(`inspiration: ${title} (${files.length})`);
}

// ---------- company archive (manually maintained photographs and captions) ----------
const historyDir = path.join(ROOT, 'content/history');
const historyOut = path.join(SITE, 'img/history');
await mkdir(historyOut, { recursive: true });
const history = [];
for (const entry of await readJSON(path.join(historyDir, 'history.json'), [])) {
  if (!entry.file || path.basename(entry.file) !== entry.file || ['en', 'el', 'ru'].some((lang) => !entry.period?.[lang] || !entry.caption?.[lang])) {
    throw new Error('History photographs need a file name and periods/captions in all three languages');
  }
  history.push({ ...entry, img: await render(path.join(historyDir, entry.file), path.join(historyOut, entry.file.replace(IMG, '')), GALLERY) });
}
console.log(`history: ${history.length} archive photographs`);
await mkdir(path.join(SITE, 'data'), { recursive: true });
await writeFile(path.join(SITE, 'data/catalog.js'), `// Generated by scripts/build.mjs from content/ — do not edit by hand.\nwindow.TAF_CATALOG = ${JSON.stringify({ built: new Date().toISOString(), categories: CATEGORIES, brands, inspiration, history })};\n`);
const shown = brands.filter((b) => b.featured);
console.log(`\n${shown.length} brands with pages · ${shown.reduce((n, b) => n + b.products.length, 0)} products · ${inspiration.length} inspiration projects · ${photos} images → site/data/catalog.js`);
