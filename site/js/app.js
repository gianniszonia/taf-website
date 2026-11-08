(() => {
  'use strict';
  const S = window.TAF_SITE;
  const I18N = window.TAF_I18N;
  const CAT = window.TAF_CATALOG;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- language ---------- */
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  const CODES = S.languages.map((l) => l.code);
  const nav2 = (navigator.language || '').slice(0, 2);
  let lang = CODES.includes(store.get('taf.lang')) ? store.get('taf.lang') : CODES.includes(nav2) ? nav2 : 'en';
  const t = (k, v) => { let s = I18N[lang][k] ?? I18N.en[k] ?? k; if (v && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, x) => v[x] ?? ''); return s; };
  const cat = (c) => t('cat')[c] || c;
  const city = (c) => t('city')[c] || c;
  const country = (c) => t('country')[c] || c || '';
  const tx = (o) => (o ? (typeof o === 'string' ? o : o[lang] || o.en || '') : '');
  const productName = (p) => tx(p.title) || p.name;
  const origin = (b) => [country(b.origin), b.founded].filter(Boolean).join(' · ');

  /* ---------- data ---------- */
  const houses = CAT.brands.filter((b) => b.featured);
  // Keep the curated landing slideshow separate from the expanded brand catalogue.
  const heroHouses = ['natuzzi-italia', 'poliform', 'porada', 'calligaris', 'natuzzi-editions']
    .map((id) => houses.find((b) => b.id === id)).filter(Boolean);
  const others = CAT.brands.filter((b) => !b.featured);
  const projects = CAT.inspiration || [];
  const byId = Object.fromEntries(CAT.brands.map((b) => [b.id, b]));
  const findPiece = (brand, category, name) => byId[brand]?.products.find((p) => p.category === category && p.name === name);
  // a product photo by brand + name pattern (falls back to a category, then the first product)
  const pick = (brand, test, fallbackCat) => {
    const b = byId[brand] || houses[0];
    return (b.products.find((p) => test.test(p.name)) || b.products.find((p) => p.category === fallbackCat) || b.products[0]).img;
  };
  const samePhoto = (a, b) => {
    if (a.lg === b.lg) return true;
    if (!a.photoHash || !b.photoHash) return false;
    let bits = BigInt(`0x${a.photoHash}`) ^ BigInt(`0x${b.photoHash}`), distance = 0;
    while (bits && distance <= 4) { distance++; bits &= bits - 1n; }
    return distance <= 4;
  };
  const homepagePhotos = [
    ...heroHouses.map((h) => h.cover), ...houses.map((h) => h.feature),
    pick('poliform', /dream/i, 'Beds'), ...projects.slice(0, 3).map((p) => p.cover),
  ];
  // Only approved room photographs absent from the rest of the homepage are eligible.
  const pool = (() => {
    const selected = CAT.selectedPieces || [];
    const lists = houses.map((h) => selected.filter((s) => s.brand === h.id).map((s) => {
      const p = findPiece(s.brand, s.category, s.name);
      return p ? { ...p, brand: h } : null;
    }).filter(Boolean));
    const out = [];
    for (let i = 0; out.length < lists.reduce((n, l) => n + l.length, 0); i++) for (const l of lists) if (l[i]) out.push(l[i]);
    return out.filter((p, i) => !homepagePhotos.some((photo) => samePhoto(p.img, photo))
      && !out.slice(0, i).some((other) => samePhoto(p.img, other.img)));
  })();
  // Sample once for this document. Routes, language changes and resizing keep the same twelve.
  const homePicks = (() => {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 12);
  })();

  /* ---------- hours ---------- */
  const nowCY = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Nicosia', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const g = (k) => parts.find((p) => p.type === k).value;
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), mins: +g('hour') * 60 + +g('minute') };
  };
  const toMin = (s) => +s.slice(0, 2) * 60 + +s.slice(3);
  function status(id) {
    const H = S.hours[id]; const { day, mins } = nowCY();
    for (const [a, b] of H[day]) if (mins >= toMin(a) && mins < toMin(b)) return `<span class="status open">${t('stores.open')} · ${t('stores.until', { t: b })}</span>`;
    let label = '';
    const later = H[day].find(([a]) => mins < toMin(a));
    if (later) label = t('stores.opens', { d: '', t: later[0] }).replace(/\s+/g, ' ');
    else for (let i = 1; i <= 7; i++) { const d = (day + i) % 7; if (H[d].length) { label = t('stores.opens', { d: t('daysShort')[d], t: H[d][0][0] }); break; } }
    return `<span class="status">${t('stores.closed')} · ${label}</span>`;
  }
  const hoursTable = (id) => { const H = S.hours[id]; const today = nowCY().day; return `<table class="hours"><tbody>${[1, 2, 3, 4, 5, 6, 0].map((d) => `<tr class="${d === today ? 'today' : ''}"><td>${t('days')[d]}</td><td>${H[d].length ? H[d].map((r) => r.join('–')).join(', ') : t('stores.closedDay')}</td></tr>`).join('')}</tbody></table>`; };
  const tel = (p) => `tel:${p.replace(/\s/g, '')}`;
  const maps = (a) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Takis Angelides Furnihome, ' + a + ', Cyprus')}`;

  /* ---------- building blocks ---------- */
  const img = (src, alt = '', extra = '') => `<img src="${src}" alt="${esc(alt)}" ${/loading=/.test(extra) ? '' : 'loading="lazy" '}decoding="async" ${extra}>`;
  // Every generated photograph lists all its sizes (widths recorded by the build); `sizes` says how wide it is
  // shown, so phones download small files and large screens get sharp ones.
  const srcset = (im) => im?.ws ? [...new Map(Object.entries(im.ws).filter(([k]) => im[k]).map(([k, w]) => [im[k], w]))].map(([u, w]) => `${u} ${w}w`).join(', ') : '';
  const photo = (im, alt, sizes, extra = '') => img(im.lg, alt, `${srcset(im) ? `srcset="${srcset(im)}" sizes="${sizes}"` : ''} ${extra}`);
  const SIZES = {
    full: '100vw',
    half: '(max-width: 760px) 100vw, 50vw',
    third: '(max-width: 560px) 100vw, (max-width: 1080px) 50vw, 33vw',
    picks: '(max-width: 760px) 86vw, 50vw',
    wide: '(max-width: 760px) 100vw, min(100vw, 1300px)',
  };
  // one product = one photo = one post
  const card = (p, brand, i, list) => {
    const sizes = list === 'sel' ? SIZES.picks : list === 'products' ? SIZES.third : i % 5 === 0 ? SIZES.wide : SIZES.half;
    return `<button class="card" data-piece="${brand.id}|${esc(p.category)}|${esc(p.name)}" data-list="${list}">
      <div class="ph">${photo(p.img, `${productName(p)} — ${brand.name}`, sizes)}</div>
      <div class="cap"><h3>${esc(productName(p))}</h3><span class="sm">${list === 'sel' ? esc(brand.name) : list === 'products' ? `${esc(brand.name)} · ${cat(p.category)}` : cat(p.category)}</span></div>
    </button>`;
  };
  const alsoList = () => `<div class="also"><span class="eyebrow">${t('houses.also')}</span><ul>${others.map((b) => `<li>${b.website ? `<a href="${b.website}" target="_blank" rel="noopener">${esc(b.name)}<span aria-hidden="true"> ↗</span></a>` : esc(b.name)}</li>`).join('')}</ul></div>`;
  const projectTile = (p, sizes = SIZES.half) => `<a class="house-tile" href="#/inspiration/${p.id}"><div class="tile-photo">${photo(p.cover, p.title, sizes)}</div><div class="t"><h3>${esc(p.title)}</h3><span class="sm">${t('insp.photos', { n: p.images.length })}</span></div></a>`;
  // Appointments live on their own page; links only carry the visitor's context there.
  const appointmentHref = ({ store = '', interest = '', piece = '' } = {}) => {
    const q = new URLSearchParams();
    if (store) q.set('store', store);
    if (interest) q.set('interest', interest);
    if (piece) q.set('piece', piece);
    return `#/appointment${q.toString() ? '?' + q : ''}`;
  };

  /* ---------- pages ---------- */
  const P = {};

  // Section heading: one serif title, with optional controls (e.g. carousel arrows) on the right.
  const head = (title, controls = '', id = '') => `<div class="head"><h2 class="title"${id ? ` id="${id}"` : ''}>${title}</h2>${controls}</div>`;
  const textLink = (href, label, arrow = '→') => `<a class="link" href="${href}">${label} <span class="arr" aria-hidden="true">${arrow}</span></a>`;
  // "1 / 3" counter for a homepage row that becomes a swipe carousel on phones (hidden on larger screens).
  const swipeCount = (track, n) => `<span class="carousel-count swipe-count" data-swipe-count="${track}" aria-live="polite">1 / ${n}</span>`;
  // A section's onward link always comes after its content, on the left, in the same size and spacing.
  const more = (href, label) => `<div class="section-more">${textLink(href, label)}</div>`;

  P.home = () => `
    <section class="hero" aria-label="Takis Angelides Furnihome">
      <div class="hero-media">${heroHouses.map((h, i) => `<div class="hero-img${i === 0 ? ' on' : ''}">${photo(h.cover, '', SIZES.full, i > 1 ? 'loading="lazy"' : i ? 'loading="eager"' : 'loading="eager" fetchpriority="high"')}</div>`).join('')}</div>
      <div class="hero-body"><div class="wrap">
        <h1><span>${t('hero.l1')}</span> <span>${t('hero.l2')}</span></h1>
        <div class="hero-actions">${textLink('#/brands', t('hero.discover'))}</div>
      </div></div>
      <div class="hero-bar"><div class="wrap"><div class="hero-bar-in">
        <a class="hero-caption" id="heroLink" href="#/brand/${heroHouses[0].id}" aria-live="polite"><span id="heroName">${esc(heroHouses[0].name)}</span></a>
        <div class="hero-progress">${heroHouses.map((h, i) => `<button class="${i === 0 ? 'on' : ''}" data-slide="${i}" aria-label="${esc(h.name)}"></button>`).join('')}</div>
      </div></div></div>
    </section>

    <section class="sec statement-sec"><div class="wrap statement">
      <span class="eyebrow">${t('intro.eyebrow')}</span>
      <p class="statement-line">${t('intro.saying').replace(/^(.*?:)\s+(.*)$/, '$1 <span>$2</span>')}</p>
      <div class="story-numbers">${[[new Date().getFullYear() - 1965, 'intro.years'], [CAT.brands.length, 'intro.brands'], [S.stores.length, 'intro.showrooms']].map(([n, label]) => `<div><strong data-count="${n}" aria-label="${n}">${n}</strong><span>${t(label)}</span></div>`).join('')}</div>
      ${textLink('#/story', t('nav.about'))}
    </div></section>

    <section class="brands-stage" aria-labelledby="brandsTitle">
      <a class="brand-preview" id="brandPreview" href="#/brand/${houses[0].id}" aria-describedby="brandPreviewName">
        <div class="brand-preview-photo">${photo(houses[0].feature, houses[0].name, SIZES.full)}</div>
      </a>
      <div class="brands-overlay"><div class="wrap">
        <h2 class="eyebrow" id="brandsTitle">${t('nav.houses')}</h2>
        <div class="brand-preview-caption"><p class="brand-name" id="brandPreviewName">${esc(houses[0].name)}</p><span class="sm" id="brandPreviewMeta">${esc(origin(houses[0]))}</span></div>
        <div class="brand-options" id="houseList" role="group" aria-label="${t('nav.houses')}">${houses.map((h, i) => `<button type="button" data-brand="${h.id}" aria-pressed="${i === 0}" aria-controls="brandPreview">${esc(h.name)}</button>`).join('')}</div>
      </div></div>
    </section>
    <section class="brands-swipe" aria-labelledby="brandsSwipeTitle">
      <div class="wrap">${head(t('nav.houses'), swipeCount('brandsTrack', houses.length), 'brandsSwipeTitle')}</div>
      <div class="brands-track" id="brandsTrack" tabindex="0" role="region" aria-roledescription="${t('selected.carousel')}" aria-labelledby="brandsSwipeTitle">${houses.map((h) => `<a class="brand-slide" href="#/brand/${h.id}">
        <div class="brand-slide-photo">${photo(h.feature, h.name, '86vw')}</div><span class="brand-slide-name">${esc(h.name)}</span><span class="sm">${esc(origin(h))}</span></a>`).join('')}</div>
    </section>
    <div class="wrap brands-after">${alsoList()}${more('#/brands', t('hero.discover'))}</div>

    <section class="sec picks-sec"><div class="wrap">
      ${head(t('selected.title'), `<div class="carousel-controls"><span id="picksCount" class="carousel-count" aria-live="polite"></span><button type="button" data-picks-step="-1" aria-controls="picks" aria-label="${t('selected.prev')}" disabled>←</button><button type="button" data-picks-step="1" aria-controls="picks" aria-label="${t('selected.next')}">→</button></div>`, 'picksTitle')}
      <div class="picks" id="picks" tabindex="0" role="region" aria-roledescription="${t('selected.carousel')}" aria-labelledby="picksTitle">${homePicks.map((p, i) => card(p, p.brand, i, 'sel')).join('')}</div>
      ${more('#/products', t('products.all'))}
    </div></section>

    ${projects.length ? `<section class="sec insp-sec"><div class="wrap">
      ${head(t('nav.inspiration'), swipeCount('inspTrack', Math.min(3, projects.length)))}
      <div class="insp-teaser" id="inspTrack">${projects.slice(0, 3).map((p, i) => projectTile(p, i ? SIZES.half : SIZES.full)).join('')}</div>
      ${more('#/inspiration', t('insp.all'))}
    </div></section>` : ''}

    ${storesStrip()}
    ${invite(pick('poliform', /dream/i, 'Beds'))}`;

  // The invitation to visit: a photograph and one quiet link to the appointment page — never a form.
  const invite = (src, title = t('visit.title'), text = t('visit.text'), interest = '') => `
    <section class="invite"><div class="invite-media">${photo(src, '', SIZES.full)}</div><div class="invite-copy"><div class="wrap">
      <h2>${title}</h2>
      ${text ? `<p>${text}</p>` : ''}
      ${textLink(appointmentHref({ interest }), t('nav.book'))}
    </div></div></section>`;

  const storesStrip = () => `
    <section class="sec stores-sec"><div class="wrap">
      ${head(t('nav.showrooms'), swipeCount('storesTrack', S.stores.length))}
      <div class="stores" id="storesTrack">${S.stores.map((s) => `<div class="store"><h3>${city(s.id)}</h3><span>${esc(s.address)}</span><a href="${tel(s.phone)}">${esc(s.phone)}</a>${status(s.id)}</div>`).join('')}</div>
      ${more('#/showrooms', t('stores.all'))}
    </div></section>`;


  const pageNumber = (q, key, total) => Math.max(0, Math.min(total - 1, (parseInt(q.get(key), 10) || 1) - 1));
  P.brands = () => `
    <section class="page-heading"><div class="wrap"><h1 class="display">${t('nav.houses')}</h1><p class="page-sub">${t('houses.sub')}</p></div></section>
    <section class="page-content"><div class="wrap">
      <div class="brand-grid">${houses.map((h) => `<a class="house-tile" href="#/brand/${h.id}"><div class="tile-photo">${photo(h.cover, h.name, SIZES.half)}</div><div class="t"><h2>${esc(h.name)}</h2><span class="sm">${esc(origin(h))}</span></div></a>`).join('')}</div>
      ${alsoList()}
    </div></section>${invite(pick('poliform', /dream/i, 'Beds'))}`;

  /* ---------- products: every published piece, filtered by category and brand ---------- */
  const allPieces = houses.flatMap((h) => h.products.map((p) => ({ p, h })));
  const pieceCategories = CAT.categories.filter((c) => allPieces.some((x) => x.p.category === c))
    .concat([...new Set(allPieces.map((x) => x.p.category))].filter((c) => !CAT.categories.includes(c)));
  // Selections are lists: any chosen brand AND any chosen category ("All" = empty list).
  const matches = (x, bs, cs) => (!bs.length || bs.includes(x.h.id)) && (!cs.length || cs.includes(x.p.category));
  const countPieces = (b, c) => allPieces.filter((x) => matches(x, b, c)).length;
  const piecesLabel = (n) => {
    const form = new Intl.PluralRules(lang).select(n);
    return t(`products.count.${form}`, { n }) === `products.count.${form}` ? t('products.count.other', { n }) : t(`products.count.${form}`, { n });
  };
  // URL form: ?c=Sofas,Beds&b=poliform,orme (several values per filter, comma-separated).
  const listParam = (q, key, valid) => [...new Set((q.get(key) || '').split(',').filter((v) => valid(v)))];
  const productQuery = (q) => ({
    b: listParam(q, 'b', (v) => houses.some((h) => h.id === v)),
    c: listParam(q, 'c', (v) => pieceCategories.includes(v)),
  });
  // Count shown beside an option: pieces it holds within the other filter's current choice ("All" = whole group).
  const optionCount = (key, value, b, c) => key === 'c' ? countPieces(b, value ? [value] : []) : countPieces(value ? [value] : [], c);
  const filterButton = (key, value, label, n, pressed, extra = false) => `<button type="button" class="${extra ? 'pf-extra' : ''}" data-pf-${key}="${esc(value)}" aria-pressed="${pressed}" ${n || pressed ? '' : 'disabled'}><span class="pf-label">${label}</span><span class="pf-n">${n}</span></button>`;
  // Lists open with the six largest options (by total pieces); "Show more" reveals the rest. The chosen
  // options always stay visible. Phones and tablets show every option in their scrolling chip rows.
  const PF_VISIBLE = 6;
  const byTotal = (items, count) => [...items].sort((x, y) => count(y) - count(x));
  const filterList = (key, items, value, label, countFor, selected) => {
    const extraCount = Math.max(0, items.length - PF_VISIBLE);
    return `${filterButton(key, '', t('brand.all'), countFor(''), !selected.length)}${items.map((x, i) => filterButton(key, value(x), label(x), countFor(value(x)), selected.includes(value(x)), i >= PF_VISIBLE)).join('')}
      ${extraCount ? `<button type="button" class="pf-more" data-pf-more aria-expanded="false"><span class="pf-more-label">${t('products.more', { n: extraCount })}</span><span class="pf-less-label">${t('products.less')}</span></button>` : ''}`;
  };
  P.products = (q) => {
    const { b, c } = productQuery(q);
    const cats = byTotal(pieceCategories, (x) => countPieces([], [x])), brands = byTotal(houses, (h) => h.products.length);
    return `<section class="page-heading"><div class="wrap"><h1 class="display">${t('nav.products')}</h1><p class="page-sub">${t('products.sub')}</p></div></section>
    <section class="page-content"><div class="wrap products-layout">
      <aside class="product-filters">
        <div class="pf-group"><h2 class="pf-title" id="pfCat">${t('products.category')}</h2><div class="pf-list" role="group" aria-labelledby="pfCat">
          ${filterList('c', cats, (x) => x, (x) => cat(x), (x) => optionCount('c', x, b, c), c)}</div></div>
        <div class="pf-group"><h2 class="pf-title" id="pfBrand">${t('products.brand')}</h2><div class="pf-list" role="group" aria-labelledby="pfBrand">
          ${filterList('b', brands, (h) => h.id, (h) => esc(h.name), (x) => optionCount('b', x, b, c), b)}</div></div>
      </aside>
      <div class="products-results"><p class="products-count" id="productsCount" aria-live="polite">${piecesLabel(countPieces(b, c))}</p>
        <div class="products-grid" id="grid">${allPieces.filter((x) => matches(x, b, c)).map((x, i) => card(x.p, x.h, i, 'products')).join('')}</div></div>
    </div></section>${invite(pick('poliform', /dream/i, 'Beds'))}`;
  };
  // The sidebar has no scrollbar of its own. When it is taller than the screen, its sticky offset goes
  // negative, so it scrolls with the page until the last option is visible and then holds there.
  function placeFilters() {
    const el = $('.product-filters');
    if (!el) return;
    if (innerWidth <= 1080) { el.style.removeProperty('--pf-top'); return; }
    const top = header.offsetHeight + 28;
    el.style.setProperty('--pf-top', `${Math.min(top, innerHeight - el.offsetHeight - 28)}px`);
  }
  addEventListener('resize', placeFilters);
  // Filters update in place (no re-render), so a phone's scrolled chip row keeps its position.
  function filterProducts(key, value) {
    const { parts } = parse(); const q = new URLSearchParams(query);
    // Clicking toggles an option; "All" clears that filter.
    const current = productQuery(q)[key];
    const next = !value ? [] : current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    next.length ? q.set(key, next.join(',')) : q.delete(key);
    const { b, c } = productQuery(q);
    const qs = q.toString().replace(/%2C/gi, ',');
    history.replaceState(history.state, '', `#/${parts.join('/')}${qs ? '?' + qs : ''}`);
    renderedURL = location.href; renderedHash = routeHash(); query = q;
    const sync = (key, chosen) => $$(`[data-pf-${key}]`).forEach((x) => {
      const value = x.dataset[key === 'c' ? 'pfC' : 'pfB'], n = optionCount(key, value, b, c), pressed = value ? chosen.includes(value) : !chosen.length;
      x.setAttribute('aria-pressed', pressed); x.disabled = !n && !pressed; $('.pf-n', x).textContent = n;
    });
    sync('c', c); sync('b', b);
    $('#productsCount').textContent = piecesLabel(countPieces(b, c));
    const grid = $('#grid');
    grid.classList.add('out');
    setTimeout(() => {
      grid.innerHTML = allPieces.filter((x) => matches(x, b, c)).map((x, i) => card(x.p, x.h, i, 'products')).join('');
      grid.classList.remove('out'); revealSections(); savePagePosition(true);
    }, reduced ? 0 : 220);
    const top = $('.products-layout').getBoundingClientRect().top + scrollY - header.offsetHeight - 24;
    if (innerWidth > 1080 && scrollY > top) scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
  }

  P.brand = (id,q) => {
    const h=byId[id];
    if(!h) return P.missing();
    if(!h.featured) return P.brands();
    const cats=[...new Set(h.products.map(p=>p.category))];
    const active=cats.includes(q.get('c'))?q.get('c'):'';
    const list=h.products.filter(p=>!active||p.category===active);
    const next=houses[(houses.indexOf(h)+1)%houses.length];
    return `<section class="b-hero"><div class="b-media">${photo(h.cover, h.name, SIZES.full, 'fetchpriority="high" loading="eager"')}</div><div class="wrap">
      <a class="eyebrow" href="#/brands">${t('nav.houses')}</a><h1>${esc(h.name)}</h1><span class="b-origin">${esc(origin(h))}</span>
    </div></section>
    <section class="b-intro-sec"><div class="wrap b-intro"><p>${esc(tx(h.intro) || tx(h.speciality))}</p>${h.website ? `<a class="link" href="${h.website}" target="_blank" rel="noopener">${t('brand.website')} <span class="arr" aria-hidden="true">↗</span></a>` : ''}</div></section>
    <section class="page-content"><div id="collection"></div><nav class="filters" aria-label="${t('brand.collection')}"><div class="wrap"><button data-cat="" aria-pressed="${!active}">${t('brand.all')}</button>${cats.map((c) => `<button data-cat="${esc(c)}" aria-pressed="${active === c}">${cat(c)}</button>`).join('')}</div></nav>
      <div class="wrap"><div class="grid" id="grid">${list.map((p, i) => card(p, h, i, id)).join('')}</div></div></section>
    ${invite(h.feature, t('brand.see', { brand: esc(h.name) }), t('brand.seeText'), h.id)}
    <a class="next-link" href="#/brand/${next.id}"><div class="wrap"><span class="eyebrow">${t('brand.next')}</span><span class="next-name">${esc(next.name)} <span class="arr" aria-hidden="true">→</span></span></div></a>`;
  };

  // Inspiration: the first project fills the screen; the rest follow as an editorial mosaic in source order.
  // Rhythm without reordering projects: each block fills whole rows of the six-column grid, so there are
  // never gaps. On narrower screens 'big' and 'full' span the width and everything else is half width;
  // the last tile turns full width if needed to keep the halves paired.
  const mosaicLayout = (n) => {
    const blocks = [['big', 'tall'], ['', '', ''], ['wide', 'wide'], ['tall', 'big'], ['', '', ''], ['wide', 'wide']];
    const out = [];
    for (let b = 0; out.length < n; b++) {
      const block = blocks[b % blocks.length], left = n - out.length;
      out.push(...(left >= block.length ? block : left === 1 ? ['full'] : ['wide', 'wide'].slice(0, left)));
    }
    if (out.filter((c) => c !== 'big' && c !== 'full').length % 2) out[n - 1] = 'full';
    return out;
  };
  const credit = (p) => p.collaboration ? `${t('insp.collaboration')} ${esc(p.collaboration.name)}` : '';
  P.inspiration = () => {
    const [featured, ...rest] = projects;
    if (!featured) return P.missing();
    const layout = mosaicLayout(rest.length);
    return `<section class="insp-feature"><div class="b-media">${photo(featured.cover, featured.title, SIZES.full, 'fetchpriority="high" loading="eager"')}</div><div class="wrap">
        <h1 class="eyebrow">${t('nav.inspiration')}</h1>
        <h2>${esc(featured.title)}</h2>
        <p>${[credit(featured), t('insp.photos', { n: featured.images.length })].filter(Boolean).join(' · ')}</p>
        ${textLink(`#/inspiration/${featured.id}`, t('insp.view'))}
      </div></section>
      <section class="insp-intro"><div class="wrap"><p>${t('insp.sub')}</p></div></section>
      <section class="page-content"><div class="wrap"><div class="mosaic">${rest.map((p, i) => { const large = ['big', 'full'].includes(layout[i]); return `<a class="mosaic-tile ${layout[i]}" href="#/inspiration/${p.id}" data-preview="${esc(JSON.stringify(p.images.slice(1, 4).map((x) => large ? x.lg : x.sm)))}">
        <div class="mosaic-photo">${photo(p.cover, p.title, large ? '(max-width: 1080px) 100vw, 66vw' : '(max-width: 760px) 50vw, 33vw')}</div><span class="mosaic-title">${esc(p.title)}</span></a>`; }).join('')}</div></div></section>`;
  };
  // Brands named in a project's own description link to their pages; nothing is inferred beyond the text.
  const projectBrands = (p) => {
    const text = (p.description?.en || []).join(' ');
    return CAT.brands.filter((b) => new RegExp(`(^|[^\\w])${b.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\w]|$)`).test(text));
  };
  const brandsRow = (p) => {
    const found = projectBrands(p);
    if (!found.length) return '';
    const withPages = found.filter((b) => b.featured), linkOnly = found.filter((b) => !b.featured);
    return `<section class="project-brands"><div class="wrap">
      ${head(t('insp.brands'))}
      ${withPages.length ? `<div class="project-brands-row">${withPages.map((b) => `<a class="house-tile" href="#/brand/${b.id}"><div class="tile-photo">${photo(b.cover, b.name, SIZES.third)}</div><div class="t"><h3>${esc(b.name)}</h3><span class="sm">${esc(origin(b))}</span></div></a>`).join('')}</div>` : ''}
      ${linkOnly.length ? `<p class="project-brands-also">${linkOnly.map((b) => b.website ? `<a href="${esc(b.website)}" target="_blank" rel="noopener">${esc(b.name)} <span aria-hidden="true">↗</span></a>` : esc(b.name)).join(' · ')}</p>` : ''}
    </div></section>`;
  };
  P.project = (id,q) => {
    const p=projects.find(x=>x.id===id);
    if(!p)return P.inspiration(q);
    const n=pageNumber(q,'photo',p.images.length), im=p.images[n];
    const next=projects[(projects.indexOf(p)+1)%projects.length];
    // The project's story is always visible, above the photographs: credit and photo count beside the description.
    const about = p.description || p.collaboration ? `<div class="project-about">
        <div class="project-meta">${p.collaboration ? `<p class="project-credit"><span>${t('insp.collaboration')}</span><a href="${esc(p.collaboration.url)}" target="_blank" rel="noopener">${esc(p.collaboration.name)} <span aria-hidden="true">↗</span></a></p>` : ''}<span class="sm">${t('insp.photos', { n: p.images.length })}</span></div>
        ${p.description ? `<div class="project-copy">${(p.description[lang] || p.description.en).map((text) => `<p>${esc(text)}</p>`).join('')}</div>` : ''}
      </div>` : '';
    return `<section class="page-heading"><div class="wrap"><a class="eyebrow" href="#/inspiration">${t('nav.inspiration')}</a><h1 class="display">${esc(p.title)}</h1>${about}</div></section>
    <section class="page-content"><div class="wrap">
      <div class="project-gallery" id="photos"><button class="gallery-stage" data-photo="${n}" aria-label="${esc(p.title)} ${n + 1}">${photo(im, p.title, SIZES.wide, 'loading="eager"')}</button>
      <div class="gallery-thumbs" role="group" aria-label="${t('pages.images')}">${p.images.map((photo, i) => `<button data-gallery-photo="${i}" aria-pressed="${i === n}" aria-label="${t('pages.number', { n: i + 1 })}">${img(photo.sm, '')}</button>`).join('')}</div></div>
    </div></section>${brandsRow(p)}${invite(pick('porada', /klem/i, 'Sofas'))}
    <a class="next-link" href="#/inspiration/${next.id}"><div class="wrap"><span class="eyebrow">${t('insp.next')}</span><span class="next-name">${esc(next.title)} <span class="arr" aria-hidden="true">→</span></span></div></a>`;
  };

  P.showrooms = () => `<section class="page-heading"><div class="wrap"><h1 class="display">${t('nav.showrooms')}</h1></div></section>
    <section class="page-content"><div class="wrap"><div class="showroom-grid">${S.stores.map(s=>`<article class="store-full" id="s-${s.id}"><div><h2>${city(s.id)}</h2>${status(s.id)}</div><div class="col"><span>${esc(s.address)}</span><a href="${tel(s.phone)}">${esc(s.phone)}</a><a href="mailto:${s.email}">${esc(s.email)}</a></div><div class="store-actions">${textLink(appointmentHref({ store: s.id }), t('nav.book'))}<a class="link" href="${maps(s.address)}" target="_blank" rel="noopener">${t('stores.directions')} <span class="arr" aria-hidden="true">↗</span></a></div><details><summary>${t('stores.hours')}</summary>${hoursTable(s.id)}<p class="muted">${t('stores.note')}</p></details><details><summary>${t('stores.natuzzi')}</summary><p>${esc(s.natuzzi.address||t('stores.natuzziSame'))}</p>${s.natuzzi.phone?`<a href="${tel(s.natuzzi.phone)}">${esc(s.natuzzi.phone)}</a>`:''}</details></article>`).join('')}</div><p class="store-head-office muted">${t('stores.head')}: ${esc(S.headOffice.address)} · <a href="${tel(S.headOffice.phone)}">${S.headOffice.phone}</a> · <a href="mailto:${S.headOffice.email}">${S.headOffice.email}</a></p></div></section>`;

  P.story = (q) => {
    const entries=CAT.history||[], n=pageNumber(q,'year',entries.length),entry=entries[n];
    return `<section class="sec"><div class="wrap story-intro"><div><span class="eyebrow">${t('nav.about')}</span><h1>${t('about.title')}</h1></div><div class="story-summary"><p>${t('about.p1')}</p><p>${t('about.p2')}</p></div></div></section>
    <section class="page-content"><div class="wrap"><h2 class="eyebrow history-heading">${t('about.timeline')}</h2><div class="history-tabs" role="group" aria-label="${t('about.timeline')}">${entries.map((item,i)=>`<button data-history="${i}" aria-pressed="${i===n}">${esc(tx(item.period))}</button>`).join('')}</div>${entry?`<article class="history-card"><div class="history-photo">${photo(entry.img, tx(entry.caption), '(max-width: 860px) 100vw, 60vw', 'loading="eager"')}</div><div class="history-caption"><h3>${esc(tx(entry.period))}</h3><p>${esc(tx(entry.caption))}</p></div></article>`:''}</div></section>`;
  };

  // A calm page of its own: photograph, invitation and a short three-part request.
  P.appointment = (q) => {
    const store = S.stores.some((s) => s.id === q.get('store')) ? q.get('store') : bk.store;
    const interest = q.has('interest') ? (byId[q.get('interest')] ? q.get('interest') : '') : bk.interest;
    Object.assign(bk, { store, interest, time: '' });
    if (q.get('piece')) bk.notes = q.get('piece');
    if (bk.date && !availableDate(new Date(bk.date + 'T12:00'))) bk.date = '';
    calendarMonth = new Date((bk.date || iso(dateLimits().min)) + 'T12:00');
    const picture = byId[interest]?.feature || pick('poliform', /dream/i, 'Beds');
    return `<section class="appointment">
      <div class="appointment-media">${photo(picture, '', '(max-width: 1080px) 100vw, 50vw', 'loading="eager"')}</div>
      <div class="appointment-body">
        <span class="eyebrow">${t('nav.book')}</span>
        <h1>${t('appt.title')}</h1>
        <p class="appointment-intro">${t('appt.intro')}</p>
        <div id="bookRoot">${bookForm()}</div>
        <p class="appointment-call">${t('appt.call')} ${S.stores.map((s) => `<a href="${tel(s.phone)}">${city(s.id)} ${esc(s.phone.replace('+357 ', ''))}</a>`).join(' · ')}</p>
      </div>
    </section>`;
  };

  P.missing = () => `<section class="sec"><div class="wrap"><h1 class="title">404</h1><p style="margin-top:24px"><a class="link" href="#/">TAF <span class="arr">→</span></a></p></div></section>`;

  /* ---------- router ---------- */
  const main = $('#main');
  const header = $('#header');
  let query = new URLSearchParams();
  const parse = () => { const [p, qs = ''] = (location.hash.replace(/^#\/?/, '') || '').split('?'); return { parts: p.split('/').filter(Boolean), q: new URLSearchParams(qs) }; };
  const NAV_FOR = { brand: 'brands', inspiration: 'inspiration' };
  history.scrollRestoration = 'manual';
  let renderedURL = '';
  let renderedHash = '', currentEntryKey = '';
  const pagePositions = new Map();
  const routeHash = () => location.hash || '#/';
  const pagePosition = () => ({ hash: routeHash(), x: scrollX, y: scrollY, picks: $('#picks')?.scrollLeft || 0, brand: $('#houseList [aria-pressed="true"]')?.dataset.brand || '' });
  function savePagePosition(persist = false) {
    if (renderedURL !== location.href) return;
    const position = { ...pagePosition(), key: currentEntryKey };
    pagePositions.set(currentEntryKey, position);
    if (persist) history.replaceState({ ...history.state, tafScroll: position }, '');
  }
  const savedPosition = () => {
    const entry = history.state?.tafScroll;
    return entry?.hash === routeHash() ? pagePositions.get(entry.key) || entry : null;
  };

  function render() {
    if (/^#\/houses?\b/.test(location.hash)) history.replaceState(history.state, '', location.hash.replace('#/houses', '#/brands').replace('#/house/', '#/brand/'));
    clearInterval(heroTimer); stopPicks();
    const { parts: [a, b], q } = parse();
    query = q;
    const pages = { undefined: () => P.home(), brands: () => P.brands(), products: () => P.products(q), brand: () => P.brand(b, q), inspiration: () => (b ? P.project(b, q) : P.inspiration(q)), showrooms: () => P.showrooms(), story: () => P.story(q), appointment: () => P.appointment(q), contact: () => P.contact() };
    main.innerHTML = (pages[a] || P.missing)();
    document.body.classList.toggle('on-hero', !!$('.hero, .b-hero, .insp-feature', main));
    document.body.classList.toggle('on-home', !a);
    document.body.dataset.page = a || 'home';
    const proj = a === 'inspiration' && b && projects.find((x) => x.id === b);
    document.title = a === 'brand' && byId[b] ? `${byId[b].name} — Takis Angelides Furnihome`
      : proj ? `${proj.title} — Takis Angelides Furnihome`
      : `Takis Angelides Furnihome${a ? ' — ' + t({ brands: 'nav.houses', products: 'nav.products', inspiration: 'nav.inspiration', showrooms: 'nav.showrooms', story: 'nav.about', appointment: 'nav.book', contact: 'nav.contact' }[a] || 'nav.houses') : ' — ' + t('hero.l1') + ' ' + t('hero.l2')}`;
    $$('.nav a[href^="#/"], .header-link').forEach((l) => l.classList.toggle('on', l.getAttribute('href') === `#/${NAV_FOR[a] || a}`));
    $('#collectionTrigger')?.classList.toggle('on', ['brands', 'brand', 'products'].includes(a));
    setCollection(false);
    closeMenu();
    onScroll();
    if (!a) { startHero(); houseSelector(); startSwipeRows(); startPicks(); }
    if (a === 'inspiration' && !b) startMosaic();
    if (a === 'products') placeFilters();
    requestAnimationFrame(() => { animateStory(); revealSections(); });
  }
  let storyObserver;
  function animateStory() {
    storyObserver?.disconnect();
    const section = $('.story-numbers');
    if (!section || reduced) return;
    $$('[data-count]', section).forEach(el => { el.textContent = '0'; });
    storyObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      storyObserver.disconnect();
      const started = performance.now();
      const frame = now => {
        if (!section.isConnected) return;
        const progress = Math.min(1, (now-started)/1200);
        $$('[data-count]', section).forEach(el => { el.textContent = Math.round(Number(el.dataset.count)*(1-Math.pow(1-progress,3))); });
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, {threshold:.75, rootMargin:'0px 0px -12% 0px'});
    storyObserver.observe(section);
  }
  let sectionObserver;
  const revealedSections = new WeakSet();
  function revealSections() {
    sectionObserver?.disconnect();
    if (reduced) return;
    const selector = '.products-grid .card, .product-filters, .statement, .head, .section-more, .brands-track, .brands-overlay .wrap, .insp-intro .wrap, .mosaic-tile, .project-brands .wrap, .brands-after, .picks, .house-tile, .invite-copy .wrap, .history-card, .store-full, .stores, .b-intro, .grid .card, .project-gallery, .story-intro, .next-link .wrap, .appointment-body';
    const elements = $$(selector, main).filter(el => !el.parentElement.closest(selector));
    // Already-visible content stays visible, including when restoring browser history.
    const pending = elements.filter(el => {
      if (revealedSections.has(el)) return false;
      if (el.getBoundingClientRect().top < innerHeight) {
        el.classList.add('scroll-visible');
        revealedSections.add(el);
        return false;
      }
      return true;
    });
    pending.forEach(el => el.classList.add('scroll-reveal'));
    sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('scroll-visible');
        revealedSections.add(entry.target);
        sectionObserver.unobserve(entry.target);
      });
    }, {threshold:0, rootMargin:'0px 0px -5% 0px'});
    pending.forEach(el => sectionObserver.observe(el));
  }
  function route(keep = false, position = null) {
    const target = position || (keep ? pagePosition() : { x: 0, y: 0, picks: 0 });
    if (pv.open) pv.close();
    render();
    renderedURL = location.href;
    renderedHash = routeHash();
    currentEntryKey = history.state?.tafScroll?.hash === renderedHash && history.state.tafScroll.key
      ? history.state.tafScroll.key : crypto.randomUUID();
    const picks = $('#picks');
    if (picks) picks.scrollTo({ left: target.picks || 0, behavior: 'instant' });
    if (target.brand) selectHouse(target.brand);
    window.scrollTo({ left: target.x || 0, top: target.y || 0, behavior: 'instant' });
    onScroll();
    savePagePosition(true);
  }

  /* ---------- scroll-driven behaviours ---------- */
  function onScroll() {
    const hero = $('.hero, .b-hero, .insp-feature', main);
    const bounds = hero?.getBoundingClientRect();
    header.classList.toggle('solid', !hero || scrollY > 64);
    // Only the opening photograph moves; the following sections scroll normally.
    if (hero?.classList.contains('hero')) {
      const offset = reduced ? 0 : Math.min(Math.max(-bounds.top, 0), bounds.height) * .6;
      hero.style.setProperty('--hero-shift', `${offset}px`);
    }
  }
  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); savePagePosition(); }); }, { passive: true });
  addEventListener('pagehide', () => savePagePosition(true));
  addEventListener('resize', onScroll);

  let heroTimer;
  function startHero() {
    clearInterval(heroTimer);
    const slides = $$('.hero-img'); const dots = $$('.hero-progress button');
    if (slides.length < 2 || reduced) return;
    let i = 0; const DUR = 7000;
    document.documentElement.style.setProperty('--dur', DUR + 'ms');
    const go = (n) => {
      if (!slides[0].isConnected) return clearInterval(heroTimer);
      // Hold the outgoing photograph's scale throughout its cross-fade.
      const outgoing = $('img', slides[i]);
      outgoing.style.transform = getComputedStyle(outgoing).transform;
      slides[i].classList.remove('on'); dots[i].classList.remove('on');
      i = (n + slides.length) % slides.length;
      $('img', slides[i]).style.transform = '';
      slides[i].classList.add('on'); void dots[i].offsetWidth; dots[i].classList.add('on');
      const nm = $('#heroName');
      nm.classList.add('swap');
      $('#heroLink').setAttribute('href', `#/brand/${heroHouses[i].id}`);
      // Warm the next photograph so its cross-fade never shows an empty frame.
      const upcoming = $('img', slides[(i + 1) % slides.length]); if (upcoming.loading === 'lazy') upcoming.loading = 'eager';
      setTimeout(() => { if (!nm.isConnected) return; nm.textContent = heroHouses[i].name; nm.classList.remove('swap'); }, 350);
    };
    const tick = () => go(i + 1);
    heroTimer = setInterval(tick, DUR);
    dots.forEach((d) => d.onclick = () => { clearInterval(heroTimer); go(+d.dataset.slide); heroTimer = setInterval(tick, DUR); });
  }
  // Inspiration mosaic: while a mouse rests on a project, it slowly fades through a few more of its photographs.
  // Nothing moves until then; touch screens and reduced-motion visitors keep the still cover.
  function startMosaic() {
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.mosaic-tile[data-preview]').forEach((tile) => {
      let timer = 0, index = 0, frames = null;
      const photo = $('.mosaic-photo', tile);
      const show = (k) => frames.forEach((f, i) => f.classList.toggle('on', i === k));
      tile.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (!frames) {
          const cover = $('img', photo); cover.classList.add('frame', 'on');
          frames = [cover, ...JSON.parse(tile.dataset.preview).map((src) => {
            const f = new Image(); f.src = src; f.alt = ''; f.decoding = 'async'; f.className = 'frame';
            photo.append(f); return f;
          })];
        }
        clearInterval(timer);
        timer = setInterval(() => {
          const next = (index + 1) % frames.length;
          if (!frames[next].complete) return; // wait for the photograph rather than fade to an empty frame
          index = next; show(index);
        }, 1600);
      });
      tile.addEventListener('pointerleave', () => { clearInterval(timer); if (frames) { index = 0; show(0); } });
    });
  }
  function selectHouse(id) {
    const brand = houses.find((h) => h.id === id), preview = $('#brandPreview');
    if (!brand || !preview) return;
    const photo = $('img', preview);
    if (photo.dataset.brand !== brand.id) {
      photo.dataset.brand = brand.id;
      // Quiet cross-fade: the new photograph appears once it has loaded.
      const next = new Image(); next.sizes = photo.sizes; next.srcset = srcset(brand.feature); next.src = brand.feature.lg;
      photo.classList.add('swap');
      const show = () => { if (photo.dataset.want !== brand.id) return; photo.srcset = srcset(brand.feature); photo.src = brand.feature.lg; photo.classList.remove('swap'); };
      photo.dataset.want = brand.id;
      next.decode().then(() => setTimeout(show, reduced ? 0 : 220), show);
    }
    photo.alt = brand.name;
    preview.href = `#/brand/${brand.id}`;
    $('#brandPreviewName').textContent = brand.name;
    $('#brandPreviewMeta').textContent = origin(brand);
    $$('#houseList [data-brand]').forEach((button) => button.setAttribute('aria-pressed', button.dataset.brand === id));
  }
  // Phones: Our Brands, Inspiration and Showrooms become rows to swipe through; each counter follows its row.
  function startSwipeRows() {
    $$('[data-swipe-count]').forEach((count) => {
      const track = $(`#${count.dataset.swipeCount}`);
      if (!track) return;
      track.addEventListener('scroll', () => {
        const first = track.firstElementChild;
        if (!first) return;
        const stride = first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
        const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
        const i = atEnd ? track.children.length - 1 : Math.min(track.children.length - 1, Math.round(track.scrollLeft / stride));
        count.textContent = `${i + 1} / ${track.children.length}`;
      }, { passive: true });
    });
  }
  function houseSelector() {
    $$('#houseList [data-brand]').forEach((button) => {
      button.onclick = () => { selectHouse(button.dataset.brand); savePagePosition(); };
      button.onpointerenter = (e) => { if (e.pointerType === 'mouse') { selectHouse(button.dataset.brand); savePagePosition(); } };
    });
  }

  /* ---------- twelve room photographs, sampled once per page load ---------- */
  let stopPicks = () => {};
  function startPicks() {
    const track = $('#picks');
    if (!track) return;
    const buttons = $$('[data-picks-step]');
    let lastVisible = 0, currentFirst = 0;
    const visibleCount = () => parseInt(getComputedStyle(track).getPropertyValue('--cards')) || 4;
    const stride = () => track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      buttons[0].disabled = track.scrollLeft <= 2;
      buttons[1].disabled = track.scrollLeft >= max - 2;
      currentFirst = Math.round(track.scrollLeft / stride());
      const pages = Math.ceil(track.children.length / visibleCount());
      $('#picksCount').textContent = `${Math.min(pages, Math.floor(currentFirst / visibleCount()) + 1)} / ${pages}`;
    };
    const resize = () => {
      const visible = visibleCount(), oldFirst = currentFirst;
      $$('.card', track).forEach((c, i) => { c.style.scrollSnapAlign = i % visible === 0 ? 'start' : 'none'; });
      if (lastVisible !== visible) track.scrollTo({ left: Math.floor(oldFirst / visible) * stride() * visible, behavior: 'instant' });
      lastVisible = visible;
      update();
    };
    const move = (direction) => {
      track.scrollBy({ left: direction * stride() * visibleCount(), behavior: reduced ? 'instant' : 'smooth' });
    };
    buttons.forEach((button) => button.onclick = () => move(Number(button.dataset.picksStep)));
    track.addEventListener('scroll', () => { update(); savePagePosition(); }, { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.target !== track) return;
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'Home' || e.key === 'End') track.scrollTo({ left: e.key === 'Home' ? 0 : track.scrollWidth, behavior: reduced ? 'instant' : 'smooth' });
        else move(e.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    addEventListener('resize', resize);
    stopPicks = () => removeEventListener('resize', resize);
    resize();
  }

  const menuBtn = $('#menuBtn');
  function closeMenu() { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', t('nav.menu')); document.body.style.overflow = ''; }

  /* ---------- viewer: a product (photo + brand + category + two buttons) or an inspiration photo ---------- */
  const pv = $('#piece');
  let pvList = [], pvIdx = 0, pvMode = 'piece';
  function openPiece(brandId, category, name, listKey) {
    pvMode = 'piece';
    // Navigate through the carousel collection or the current filtered brand grid.
    pvList = $$(listKey === 'sel' ? '#picks .card' : '#grid .card').map((c) => { const [bid, category, n] = c.dataset.piece.split('|'); return { p: findPiece(bid, category, n), b: byId[bid] }; });
    pvIdx = Math.max(0, pvList.findIndex((x) => x.p.name === name && x.p.category === category && x.b.id === brandId));
    renderViewer(); if (!pv.open) pv.showModal();
  }
  function openPhoto(i) {
    const p = projects.find((x) => x.id === parse().parts[1]);
    if (!p) return;
    pvMode = 'photo'; pvList = p.images.map((im) => ({ im, title: p.title })); pvIdx = i;
    renderViewer(); if (!pv.open) pv.showModal();
  }
  function renderViewer() {
    const n = pvList.length;
    const nav = n > 1 ? `<div class="pv-nav"><button data-step="-1" aria-label="${t('viewer.prev')}">←</button><span class="pv-count" aria-live="polite">${pvIdx + 1} / ${n}</span><button data-step="1" aria-label="${t('viewer.next')}">→</button></div>` : '';
    pv.classList.toggle('photo', pvMode === 'photo');
    if (pvMode === 'photo') {
      const { im, title } = pvList[pvIdx];
      pv.innerHTML = `<button class="x" data-close aria-label="${t('book.close')}"></button>
        <div class="pv-img"><img src="${im.lg}" alt="${esc(title)} ${pvIdx + 1}">${nav}</div>`;
      return;
    }
    const { p, b } = pvList[pvIdx];
    const site = p.url || b.website;
    pv.innerHTML = `<button class="x" data-close aria-label="${t('book.close')}"></button>
      <div class="pv-img"><img src="${p.img.lg}" alt="${esc(productName(p))} — ${esc(b.name)}">${nav}</div>
      <div class="pv-body">
        <h2>${esc(productName(p))}</h2>
        <dl><dt>${t('piece.house')}</dt><dd><a href="#/brand/${b.id}" data-close>${esc(b.name)}</a></dd><dt>${t('piece.category')}</dt><dd>${cat(p.category)}</dd></dl>
        <div class="pv-actions">
          <button class="link" data-book data-interest="${b.id}" data-piece-name="${esc(productName(p))}">${t('nav.book')} <span class="arr" aria-hidden="true">→</span></button>
          ${site ? `<a class="link" href="${esc(site)}" target="_blank" rel="noopener">${t('brand.website')} <span class="arr" aria-hidden="true">↗</span></a>` : ''}
        </div>
      </div>`;
  }
  const step = (d) => { pvIdx = (pvIdx + d + pvList.length) % pvList.length; renderViewer(); };
  pv.addEventListener('click', (e) => {
    if (e.target === pv || e.target.closest('[data-close]')) return pv.close();
    const s = e.target.closest('[data-step]'); if (s) step(+s.dataset.step);
  });
  pv.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  let tx0 = null;
  // Swipe left/right anywhere in the viewer (photo, text or buttons) to move between pieces. Mostly
  // vertical gestures are left alone so the viewer can still scroll on small screens.
  let ty0 = null;
  pv.addEventListener('touchstart', (e) => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; }, { passive: true });
  pv.addEventListener('touchend', (e) => {
    if (tx0 === null) return;
    const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0; tx0 = ty0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5 && pvList.length > 1) step(dx < 0 ? 1 : -1);
  });

  /* ---------- booking ---------- */
  const bk = { store: 'nicosia', interest: '', date: '', time: '', name: '', phone: '', email: '', notes: '' };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dateLimits = () => {
    const min = new Date(); min.setHours(12, 0, 0, 0); min.setDate(min.getDate() + 1);
    const max = new Date(min); max.setDate(max.getDate() + 89);
    return { min, max };
  };
  const availableDate = (d) => {
    const { min, max } = dateLimits();
    return d >= min && d <= max && S.hours[bk.store][d.getDay()].some(([a, b]) => toMin(b) - toMin(a) >= 60);
  };
  let calendarMonth;
  function calendar() {
    const { min, max } = dateLimits();
    const y = calendarMonth.getFullYear(), m = calendarMonth.getMonth();
    const first = new Date(y, m, 1, 12), last = new Date(y, m + 1, 0, 12);
    const month = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(first);
    const fullDate = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const cells = Array.from({ length: (first.getDay() + 6) % 7 }, () => '<span></span>');
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(y, m, day, 12), value = iso(d), enabled = availableDate(d);
      cells.push(`<button type="button" data-date="${value}" ${enabled ? '' : 'disabled'} aria-pressed="${bk.date === value}" aria-label="${esc(fullDate.format(d))}${enabled ? '' : ', ' + t('book.unavailable')}">${day}</button>`);
    }
    return `<div class="calendar-head"><button type="button" data-month="-1" aria-label="${t('book.prevMonth')}" ${first <= new Date(min.getFullYear(), min.getMonth(), 1, 12) ? 'disabled' : ''}>←</button><span aria-live="polite">${esc(month)}</span><button type="button" data-month="1" aria-label="${t('book.nextMonth')}" ${last >= max ? 'disabled' : ''}>→</button></div>
      <div class="calendar-week" aria-hidden="true">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<span>${t('daysShort')[d]}</span>`).join('')}</div>
      <div class="calendar-days">${cells.join('')}</div><p class="calendar-note">${t('book.availableDates')}</p>`;
  }
  const slots = () => {
    if (!bk.date) return null;
    const out = [];
    for (const [a, b] of S.hours[bk.store][new Date(bk.date + 'T12:00').getDay()]) for (let m = toMin(a); m <= toMin(b) - 60; m += 30) out.push(`${String(m / 60 | 0).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    return out;
  };
  const bookRoot = () => $('#bookRoot');
  function renderBook(bad = '') { const root = bookRoot(); if (root) root.innerHTML = bookForm(bad); }
  function bookForm(bad = '') {
    const sl = slots();
    return `<form id="bookForm" novalidate>
        <fieldset class="step"><legend><span>01</span>${t('appt.where')}</legend>
        <div class="f"><span class="lbl">${t('book.store')}</span><div class="chips">${S.stores.map((s) => `<button type="button" data-store-pick="${s.id}" aria-pressed="${bk.store === s.id}">${city(s.id)}</button>`).join('')}</div></div>
        <div class="f"><span class="lbl" id="interestLabel">${t('book.interest')}</span><input id="bInterest" type="hidden" value="${esc(bk.interest)}">
          <details class="booking-picker" id="interestPicker"><summary aria-labelledby="interestLabel interestValue"><span id="interestValue">${esc(byId[bk.interest]?.name || t('book.any'))}</span><span class="picker-chevron" aria-hidden="true"></span></summary>
            <div class="picker-panel interest-options" role="group" aria-labelledby="interestLabel">${[{ id: '', name: t('book.any') }, ...CAT.brands].map((b) => `<button type="button" data-interest-pick="${b.id}" aria-pressed="${bk.interest === b.id}"><span>${esc(b.name)}</span><span aria-hidden="true">${bk.interest === b.id ? '✓' : ''}</span></button>`).join('')}</div>
          </details></div></fieldset>
        <fieldset class="step"><legend><span>02</span>${t('appt.when')}</legend>
        <div class="f ${bad === 'date' ? 'bad' : ''}"><span class="lbl" id="dateLabel">${t('book.date')}</span>
          <details class="booking-picker" id="datePicker"><summary id="bDate" aria-labelledby="dateLabel dateValue"><span id="dateValue" class="${bk.date ? '' : 'muted'}">${bk.date ? esc(new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(bk.date + 'T12:00'))) : t('book.pickDate')}</span><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M7 2v6m10-6v6M3 11h18"/></svg></summary>
            <div class="picker-panel calendar" id="calendar" role="group" aria-labelledby="dateLabel">${calendar()}</div>
          </details></div>
        <div class="f ${bad === 'time' ? 'bad' : ''}"><span class="lbl">${t('book.time')}</span><div class="chips">${sl === null ? `<span class="hint">${t('book.pickDate')}</span>` : sl.length ? sl.map((s) => `<button type="button" data-slot="${s}" aria-pressed="${bk.time === s}">${s}</button>`).join('') : `<span class="hint">${t('book.closedDay')}</span>`}</div></div></fieldset>
        <fieldset class="step"><legend><span>03</span>${t('appt.who')}</legend>
        <div class="f-row"><div class="f ${bad === 'name' ? 'bad' : ''}"><label for="bName">${t('book.name')}</label><input id="bName" autocomplete="name" value="${esc(bk.name)}"></div>
          <div class="f ${bad === 'phone' ? 'bad' : ''}"><label for="bPhone">${t('book.phone')}</label><input id="bPhone" type="tel" autocomplete="tel" placeholder="+357" value="${esc(bk.phone)}"></div></div>
        <div class="f"><label for="bEmail">${t('book.email')}</label><input id="bEmail" type="email" autocomplete="email" value="${esc(bk.email)}"></div>
        <div class="f"><label for="bNotes">${t('book.notes')}</label><textarea id="bNotes" placeholder="${t('book.notesPh')}">${esc(bk.notes)}</textarea></div></fieldset>
        <div class="foot"><button class="btn" type="submit">${t('book.send')}</button><span class="note">${t('book.demo')}</span></div>
      </form>`;
  }
  const keep = () => { const root = bookRoot(); if (!root) return; for (const [k, id] of [['interest', 'bInterest'], ['name', 'bName'], ['phone', 'bPhone'], ['email', 'bEmail'], ['notes', 'bNotes']]) { const el = $('#' + id, root); if (el) bk[k] = el.value; } };
  // Booking controls live on the appointment page; main persists across routes, so delegate from it.
  main.addEventListener('click', (e) => {
    const root = bookRoot();
    if (!root || !root.contains(e.target)) return;
    $$('.booking-picker[open]', root).forEach((p) => { if (!p.contains(e.target)) p.open = false; });
    const interest = e.target.closest('[data-interest-pick]');
    if (interest) { keep(); bk.interest = interest.dataset.interestPick; renderBook(); $('#interestPicker summary', root).focus(); return; }
    const month = e.target.closest('[data-month]');
    if (month) {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + Number(month.dataset.month), 1, 12);
      $('#calendar', root).innerHTML = calendar();
      const next = $(`[data-month="${month.dataset.month}"]`, root);
      (next.disabled ? $(`[data-month="${-Number(month.dataset.month)}"]`, root) : next).focus(); return;
    }
    const date = e.target.closest('[data-date]');
    if (date && availableDate(new Date(date.dataset.date + 'T12:00'))) { keep(); bk.date = date.dataset.date; bk.time = ''; renderBook(); $('#bDate', root).focus(); return; }
    const s = e.target.closest('[data-store-pick]'); if (s) { keep(); bk.store = s.dataset.storePick; bk.time = ''; if (bk.date && !availableDate(new Date(bk.date + 'T12:00'))) bk.date = ''; renderBook(); $(`[data-store-pick="${bk.store}"]`, root).focus(); return; }
    const sl = e.target.closest('[data-slot]'); if (sl) { keep(); bk.time = sl.dataset.slot; renderBook(); $(`[data-slot="${bk.time}"]`, root)?.focus(); return; }
  });
  main.addEventListener('keydown', (e) => {
    const picker = e.key === 'Escape' && $('#bookRoot .booking-picker[open]');
    if (picker) { e.preventDefault(); picker.open = false; $('summary', picker).focus(); }
  });
  main.addEventListener('submit', (e) => {
    if (e.target.id !== 'bookForm') return;
    e.preventDefault();
    keep();
    const root = bookRoot();
    const bad = !bk.date || !availableDate(new Date(bk.date + 'T12:00')) ? 'date' : !slots()?.includes(bk.time) ? 'time' : !bk.name.trim() ? 'name' : !bk.phone.trim() ? 'phone' : '';
    if (bad) { renderBook(bad); $('.f.bad summary, .f.bad input, .f.bad button', root)?.focus(); return; }
    const date = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(bk.date + 'T12:00'));
    root.innerHTML = `<div class="done" tabindex="-1"><h2>${esc(t('book.okTitle', { name: bk.name.trim().split(/\s+/)[0] }))}</h2><p>${esc(t('book.okText', { store: city(bk.store), date, time: bk.time }))}</p><p class="note">${t('book.demo')}</p><a class="link" href="#/">${t('appt.home')} <span class="arr" aria-hidden="true">→</span></a></div>`;
    $('.done', root).focus({ preventScroll: true });
    root.scrollIntoView({ block: 'start', behavior: reduced ? 'instant' : 'smooth' });
  });
  /* ---------- contact (its own page, like the appointment) ---------- */
  const contactDraft = { name: '', subject: '', phone: '', email: '', message: '' };
  main.addEventListener('input', (e) => {
    if (e.target.closest('#contactForm') && Object.hasOwn(contactDraft, e.target.name)) contactDraft[e.target.name] = e.target.value;
  });
  main.addEventListener('submit', (e) => { if (e.target.id === 'contactForm') { e.preventDefault(); validateContact(e.target); } });
  addEventListener('resize', () => { if (innerWidth > 1360 && document.body.classList.contains('menu-open')) closeMenu(); });
  function validateContact(form) {
    const fields = $$('input, textarea', form);
    fields.forEach((field) => {
      field.value = field.value.trim();
      contactDraft[field.name] = field.value;
      field.setAttribute('aria-invalid', String(!field.validity.valid));
      field.closest('.f').classList.toggle('bad', !field.validity.valid);
    });
    const status = $('#contactStatus', form);
    const valid = form.checkValidity();
    status.textContent = t(valid ? 'contact.demoDone' : 'contact.invalid');
    status.classList.toggle('bad', !valid);
    if (!valid) $(':invalid', form)?.focus();
    // This preview intentionally makes no network request and opens no email client.
  }
  P.contact = () => `<section class="contact-page"><div class="wrap">
      <div class="contact-head">
        <h1 class="display">${t('nav.contact')}</h1>
        <p class="page-sub">${t('contact.sub')}</p>
      </div>
      <div class="contact-intro">
        <div class="contact-methods">
          <a href="mailto:${esc(S.headOffice.email)}"><span class="eyebrow">${t('contact.email')}</span><span>${esc(S.headOffice.email)}</span></a>
          <a href="${tel(S.headOffice.phone)}"><span class="eyebrow">${t('contact.call')}</span><span>${esc(S.headOffice.phone)}</span></a>
        </div>
        <div class="contact-stores"><h2 class="eyebrow">${t('nav.showrooms')}</h2>${S.stores.map((s) => `<div><span>${city(s.id)}</span><a href="${tel(s.phone)}">${esc(s.phone)}</a></div>`).join('')}
          ${textLink('#/showrooms', t('stores.all'))}</div>
        <div class="contact-book"><p>${t('contact.appointment')}</p>${textLink('#/appointment', t('nav.book'))}</div>
      </div>
      <form id="contactForm" class="contact-form" novalidate aria-labelledby="contactFormTitle" aria-describedby="contactDemo">
        <h2 class="pf-title contact-form-title" id="contactFormTitle">${t('contact.formTitle')}</h2>
        <div class="f-row"><div class="f"><label for="cName">${t('contact.name')}</label><input id="cName" name="name" autocomplete="name" maxlength="120" required value="${esc(contactDraft.name)}"></div>
          <div class="f"><label for="cSubject">${t('contact.subject')}</label><input id="cSubject" name="subject" maxlength="160" required value="${esc(contactDraft.subject)}"></div></div>
        <div class="f-row"><div class="f"><label for="cPhone">${t('contact.phoneField')}</label><div class="contact-phone"><span>+357</span><input id="cPhone" name="phone" type="tel" autocomplete="tel-national" maxlength="32" value="${esc(contactDraft.phone)}"></div></div>
          <div class="f"><label for="cEmail">${t('contact.emailField')}</label><input id="cEmail" name="email" type="email" autocomplete="email" maxlength="254" required value="${esc(contactDraft.email)}"></div></div>
        <div class="f"><label for="cMessage">${t('contact.message')}</label><textarea id="cMessage" name="message" maxlength="5000" rows="6" required>${esc(contactDraft.message)}</textarea></div>
        <div class="contact-submit"><button class="btn" type="submit">${t('contact.send')}</button><p class="note" id="contactDemo">${t('contact.demo')}</p><p id="contactStatus" class="contact-status" role="status" aria-live="polite"></p></div>
      </form>
    </div></section>`;
  /* ---------- Collection menu (wide screens): products by category and brands in one calm panel ---------- */
  const collectionMenu = $('#collectionMenu'), collectionPanel = $('#collectionPanel'), collectionTrigger = $('#collectionTrigger');
  let collectionTimer = 0;
  // The panel's columns start directly beneath the "Collection" button, whatever the screen width.
  function alignCollection() {
    const inner = $('.collection-inner', collectionPanel);
    if (!inner || collectionPanel.hidden) return;
    inner.style.paddingLeft = '';
    inner.style.paddingLeft = `${Math.max(0, collectionTrigger.getBoundingClientRect().left - inner.getBoundingClientRect().left)}px`;
  }
  addEventListener('resize', alignCollection);
  // The panel's photograph shows a random brand each time it opens, then changes every few seconds while open.
  let featureBrand = '', featureTimer = 0;
  function showCollectionFeature() {
    const link = $('#collectionFeature', collectionPanel);
    if (!link) return;
    const choices = houses.filter((h) => h.id !== featureBrand);
    const brand = choices[Math.floor(Math.random() * choices.length)];
    featureBrand = brand.id;
    const photo = $('img', link), caption = $('.cf-title', link);
    const apply = () => {
      if (featureBrand !== brand.id) return;
      photo.src = brand.feature.sm || brand.feature.lg; photo.alt = brand.name;
      caption.textContent = t('collection.new', { brand: brand.name });
      link.href = `#/brand/${brand.id}`;
      link.classList.remove('swap');
    };
    if (!photo.getAttribute('src') || reduced) return apply();
    link.classList.add('swap');
    const next = new Image(); next.src = brand.feature.sm || brand.feature.lg;
    next.decode().then(() => setTimeout(apply, 300), apply);
  }
  function setCollection(open) {
    clearTimeout(collectionTimer);
    const opening = open && collectionPanel.hidden;
    collectionPanel.hidden = !open;
    collectionTrigger.setAttribute('aria-expanded', String(open));
    header.classList.toggle('mega', open);
    clearInterval(featureTimer);
    if (open) alignCollection();
    if (opening) showCollectionFeature();
    if (open && !reduced) featureTimer = setInterval(showCollectionFeature, 4500);
  }
  const collectionPanelHTML = () => {
    // Each list runs down two columns (rows = half its length); brands come first.
    const list = (items) => `<ul style="--rows:${Math.ceil(items.length / 2)}">${items.join('')}</ul>`;
    return `<div class="wrap collection-inner">
      <div><h2 class="pf-title">${t('nav.houses')}</h2>${list([`<li><a href="#/brands"><b>${t('houses.all')}</b></a></li>`, ...CAT.brands.map((h) => h.featured ? `<li><a href="#/brand/${h.id}">${esc(h.name)}</a></li>` : h.website ? `<li><a href="${esc(h.website)}" target="_blank" rel="noopener">${esc(h.name)} <span class="ext" aria-hidden="true">↗</span></a></li>` : '').filter(Boolean)])}</div>
      <div><h2 class="pf-title">${t('nav.products')}</h2>${list([`<li><a href="#/products"><b>${t('products.all')}</b></a></li>`, ...pieceCategories.map((c) => `<li><a href="#/products?c=${encodeURIComponent(c)}">${cat(c)}</a></li>`)])}</div>
      <a class="collection-feature" id="collectionFeature" href="#/brands"><img alt="" decoding="async"><span class="cf-caption"><span class="cf-title"></span> <span aria-hidden="true">→</span></span></a>
    </div>`;
  };
  const wideHeader = () => innerWidth > 1360;
  collectionMenu.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && wideHeader()) setCollection(true); });
  collectionMenu.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') collectionTimer = setTimeout(() => { if (!collectionMenu.contains(document.activeElement)) setCollection(false); }, 160); });
  collectionMenu.addEventListener('focusout', () => setTimeout(() => { if (!collectionMenu.contains(document.activeElement)) setCollection(false); }, 0));
  collectionTrigger.addEventListener('click', () => setCollection(collectionPanel.hidden));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !collectionPanel.hidden) { setCollection(false); collectionTrigger.focus(); } });
  addEventListener('resize', () => { if (!wideHeader()) setCollection(false); });
  document.addEventListener('pointerdown', (e) => { if (!collectionPanel.hidden && !collectionMenu.contains(e.target)) setCollection(false); });

  function chrome() {
    collectionPanel.innerHTML = collectionPanelHTML();
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $('#lang').innerHTML = S.languages.map((l) => `<button data-lang="${l.code}" lang="${l.code}" title="${l.name}" aria-pressed="${l.code === lang}">${l.label}</button>`).join('');
    if (!$('#navActions')) $('#nav').insertAdjacentHTML('beforeend', '<div class="nav-actions" id="navActions"><a href="#/appointment" data-i18n="nav.book"></a><a href="#/contact" data-i18n="nav.contact"></a></div>');
    $$('#navActions [data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    menuBtn.setAttribute('aria-label', t('nav.menu'));
    const allBrands = [...CAT.brands].sort((a, b) => a.name.localeCompare(b.name));
    $('#footer').innerHTML = `<div class="wrap">
      <div class="f-grid">
        <div class="f-identity"><img src="img/logos/taf-white.svg" alt="Takis Angelides Furnihome"><p>${t('footer.tag')}</p></div>
        <div class="f-brands"><h4>${t('nav.houses')}</h4><ul>${allBrands.map((b) => `<li>${b.website
          ? `<a href="${esc(b.website)}" target="_blank" rel="noopener noreferrer">${esc(b.name)}</a>` : `<span>${esc(b.name)}</span>`}</li>`).join('')}</ul></div>
        <div><h4>${t('nav.showrooms')}</h4><ul>${S.stores.map((s) => `<li><a href="#/showrooms">${city(s.id)}</a> · <a href="${tel(s.phone)}">${s.phone.replace('+357 ', '')}</a></li>`).join('')}</ul></div>
        <div><h4>TAF</h4><ul><li><a href="#/products">${t('nav.products')}</a></li><li><a href="#/inspiration">${t('nav.inspiration')}</a></li><li><a href="#/story">${t('nav.about')}</a></li><li><a href="#/appointment">${t('nav.book')}</a></li><li><a href="#/contact">${t('nav.contact')}</a></li></ul></div>
        <div><h4>${t('footer.social')}</h4><ul><li><a href="${S.social.instagram}" target="_blank" rel="noopener">Instagram</a></li><li><a href="${S.social.facebook}" target="_blank" rel="noopener">Facebook</a></li></ul></div>
      </div>
      <div class="f-bottom"><span>© ${new Date().getFullYear()} Takis Angelides Furnihome Ltd. ${t('footer.rights')}</span><span>${S.stores.map((s) => city(s.id)).join(' · ')}</span></div>
    </div>`;
  }

  document.addEventListener('click', (e) => {
    const l = e.target.closest('[data-lang]');
    if (l) { lang = l.dataset.lang; store.set('taf.lang', lang); chrome(); route(true); return; }
    const b = e.target.closest('[data-book]');
    if (b) {
      e.preventDefault(); closeMenu();
      const href = appointmentHref({ store: b.dataset.store, interest: b.dataset.interest, piece: b.dataset.pieceName });
      if (href !== routeHash()) { savePagePosition(true); history.pushState(null, '', href); }
      route();
      return;
    }
    const c = e.target.closest('[data-piece]');
    if (c) { const [bid, category, n] = c.dataset.piece.split('|'); openPiece(bid, category, n, c.dataset.list); return; }
    const ph = e.target.closest('[data-photo]');
    if (ph) { openPhoto(+ph.dataset.photo); return; }
    const gallery = e.target.closest('[data-gallery-photo], [data-history]');
    if (gallery) {
      savePagePosition(true);
      const position = pagePosition(), {parts,q} = parse();
      const key = gallery.hasAttribute('data-history') ? 'year' : 'photo';
      q.set(key, Number(gallery.dataset.history ?? gallery.dataset.galleryPhoto) + 1);
      history.replaceState(history.state, '', '#/' + parts.join('/') + '?' + q);
      route(false, position);
      const replacement = main.querySelector(key === 'year' ? '[data-history="' + gallery.dataset.history + '"]' : '[data-gallery-photo="' + gallery.dataset.galleryPhoto + '"]');
      replacement?.focus({preventScroll:true});
      replacement?.scrollIntoView({block:'nearest', inline:'nearest', behavior:'instant'});
      return;
    }
    const more = e.target.closest('[data-pf-more]');
    if (more) { const open = more.getAttribute('aria-expanded') !== 'true'; more.setAttribute('aria-expanded', open); more.closest('.pf-list').classList.toggle('expanded', open); placeFilters(); return; }
    const pf = e.target.closest('[data-pf-c], [data-pf-b]');
    if (pf) { 'pfC' in pf.dataset ? filterProducts('c', pf.dataset.pfC) : filterProducts('b', pf.dataset.pfB); return; }
    const f = e.target.closest('[data-cat]');
    if (f) {
      const { parts } = parse(); const q = new URLSearchParams(query); f.dataset.cat ? q.set('c', f.dataset.cat) : q.delete('c');
      history.replaceState(history.state, '', `#/${parts.join('/')}${q.toString() ? '?' + q : ''}`);
      renderedURL = location.href;
      renderedHash = routeHash();
      savePagePosition(true);
      query = q;
      const h = byId[parts[1]]; const active = f.dataset.cat;
      $$('.filters [data-cat]').forEach((x) => x.setAttribute('aria-pressed', x === f));
      const grid = $('#grid');
      grid.classList.add('out');
      setTimeout(() => {
        grid.innerHTML = h.products.filter((p) => !active || p.category === active).map((p, i) => card(p, h, i, h.id)).join('');
        grid.classList.remove('out'); revealSections(); savePagePosition();
      }, 260);
      const y = $('#collection').getBoundingClientRect().top + scrollY - header.offsetHeight;
      if (scrollY > y) scrollTo({ top: y, behavior: 'smooth' });
      return;
    }
    if (e.target.closest('a[href="#main"]')) {
      e.preventDefault();
      main.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const link = e.target.closest('a[href^="#/"]');
    if (link && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !link.target && !link.hasAttribute('download')) {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href === routeHash() || (link.classList.contains('logo') && !parse().parts.length)) {
        closeMenu();
        window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
      } else {
        savePagePosition(true);
        history.pushState(null, '', href);
        route();
      }
      return;
    }
    if (e.target.closest('#menuBtn')) {
      const open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', t(open ? 'nav.close' : 'nav.menu'));
      document.body.style.overflow = open ? 'hidden' : '';
    }
  });
  const restoreRoute = () => {
    if (renderedURL === location.href && history.state?.tafScroll?.key === currentEntryKey) return;
    // The DOM still belongs to the page being left; keep its last position before replacing it.
    if (currentEntryKey) pagePositions.set(currentEntryKey, { ...pagePosition(), hash: renderedHash, key: currentEntryKey });
    route(false, savedPosition());
  };
  addEventListener('popstate', restoreRoute);
  addEventListener('hashchange', restoreRoute);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu(); });

  chrome();
  route(false, savedPosition());
})();
