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
  // A stable, brand-interleaved order for the manually controlled product carousel.
  const pool = (() => {
    const lists = houses.map((h) => h.products.map((p) => ({ ...p, brand: h })));
    const out = [];
    for (let i = 0; out.length < lists.reduce((n, l) => n + l.length, 0); i++) for (const l of lists) if (l[i]) out.push(l[i]);
    return out;
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
  const img = (src, alt = '', extra = '') => `<img src="${src}" alt="${esc(alt)}" loading="lazy" decoding="async" onload="this.classList.add('ld')" ${extra}>`;
  // one product = one photo = one post
  const card = (p, brand, i, list) => `<button class="card" data-piece="${brand.id}|${esc(p.category)}|${esc(p.name)}" data-list="${list}" style="--d:${Math.min(i, 8) * 70}ms">
      <div class="ph wipe">${img(p.img.card, `${productName(p)} — ${brand.name}`)}</div>
      <div class="cap"><h3>${esc(productName(p))}</h3><span class="sm">${list === 'sel' ? esc(brand.name) : cat(p.category)}</span></div>
    </button>`;
  const alsoList = () => `<div class="also rv"><span class="eyebrow">${t('houses.also')}</span><ul>${others.map((b) => `<li>${b.website ? `<a href="${b.website}" target="_blank" rel="noopener">${esc(b.name)}</a>` : esc(b.name)}<span> — ${esc(origin(b))}${b.speciality ? `, ${esc(tx(b.speciality))}` : ''}</span></li>`).join('')}</ul></div>`;
  const projectTile = (p, cls = '') => `<a class="house-tile rv wipe ${cls}" href="#/inspiration/${p.id}">${img(p.cover.lg, p.title)}<div class="t"><h2>${esc(p.title)}</h2><span class="eyebrow">${t('insp.photos', { n: p.images.length })}</span></div></a>`;

  /* ---------- pages ---------- */
  const P = {};

  P.home = () => `
    <section class="hero" aria-label="TAF">
      <div class="hero-media">${heroHouses.map((h, i) => `<div class="hero-img${i === 0 ? ' on' : ''}"><img src="${h.cover.lg}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></div>`).join('')}</div>
      <div class="hero-body"><div class="wrap">
        <h1><span class="line-mask"><span>${t('hero.l1')}</span></span><span class="line-mask"><span><em>${t('hero.l2')}</em></span></span></h1>
        <div class="hero-actions fade-in"><a class="btn light" href="#/brands">${t('hero.discover')}</a><button class="link" data-book style="color:#fff">${t('nav.book')} <span class="arr">→</span></button></div>
      </div></div>
      <div class="hero-bar fade-in"><div class="wrap"><div class="hero-bar-in">
        <a class="hero-caption" id="heroLink" href="#/brand/${heroHouses[0].id}" aria-live="polite"><b id="heroName">${esc(heroHouses[0].name)}</b><span id="heroMeta">${esc(origin(heroHouses[0]))}</span></a>
        <div class="hero-progress"><span class="hero-count" id="heroCount">01 / ${String(heroHouses.length).padStart(2, '0')}</span>${heroHouses.map((h, i) => `<button class="${i === 0 ? 'on' : ''}" data-slide="${i}" aria-label="${esc(h.name)}"></button>`).join('')}</div>
      </div></div></div>
    </section>

    <section class="sec"><div class="wrap"><div class="statement">
      <span class="eyebrow rv">${t('intro.eyebrow')} · 1965 — ${new Date().getFullYear()}</span>
      <p class="lead rv d1">${t('intro.text')}</p>
      <a class="link rv d2" href="#/story">${t('intro.link')} <span class="arr">→</span></a>
    </div></div></section>

    <section class="sec home-makers"><div class="wrap">
      <div class="head"><div><h2 class="title rv d1">${t('houses.title')}</h2></div><p class="rv d2">${t('houses.sub')}</p></div>
      <div class="houses">
        <div>
          <div class="house-list" id="houseList">${houses.map((h, i) => `
            <a class="house-row rv" href="#/brand/${h.id}" data-i="${i}">
              <span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(h.name)}</h3><span class="meta">${esc(origin(h))}</span>
              <div class="mobile-img">${img(h.feature.sm, h.name)}</div>
            </a>`).join('')}</div>
          ${alsoList()}
        </div>
        <div class="house-preview" aria-hidden="true">${houses.map((h, i) => `<figure class="${i === 0 ? 'on' : ''}">${img(h.feature.lg, '')}<figcaption>${esc(h.name)} — ${t('houses.pieces', { n: h.products.length })}</figcaption></figure>`).join('')}</div>
      </div>
    </div></section>

    <section class="sec" style="padding-top:0"><div class="wrap">
      <div class="head"><div><h2 class="title rv d1" id="picksTitle">${t('selected.title')}</h2></div><div class="carousel-controls"><span id="picksCount" class="carousel-count" aria-live="polite"></span><button type="button" data-picks-step="-1" aria-controls="picks" aria-label="${t('selected.prev')}" disabled>←</button><button type="button" data-picks-step="1" aria-controls="picks" aria-label="${t('selected.next')}">→</button></div></div>
      <div class="picks" id="picks" tabindex="0" role="region" aria-roledescription="${t('selected.carousel')}" aria-labelledby="picksTitle">${pool.map((p, i) => card(p, p.brand, i, 'sel')).join('')}</div>
    </div></section>

    ${projects.length ? `<section class="sec" style="padding-top:0"><div class="wrap">
      <div class="head"><div><span class="eyebrow rv">${t('insp.eyebrow')}</span><h2 class="title rv d1">${t('insp.title')}</h2></div><a class="link rv" href="#/inspiration">${t('insp.all')} <span class="arr">→</span></a></div>
      <div class="house-grid insp-teaser">${projects.slice(0, 3).map((p) => projectTile(p)).join('')}</div>
    </div></section>` : ''}

    ${band(pick('poliform', /dream/i, 'Beds').lg)}
    ${storesStrip()}`;

  const band = (src, title = t('visit.title'), text = t('visit.text'), interest = '') => `
    <section class="band rv"><div class="band-media">${img(src, '')}</div><div class="wrap">
      <span class="eyebrow">${t('visit.eyebrow')}</span><h2>${title}</h2><p>${text}</p>
      <button class="btn light" data-book ${interest ? `data-interest="${interest}"` : ''}>${t('nav.book')}</button></div></section>`;

  const storesStrip = () => `
    <section class="sec-tight"><div class="wrap">
      <div class="head"><div><span class="eyebrow rv">${t('stores.eyebrow')}</span><h2 class="title rv d1">${t('stores.title')}</h2></div><a class="link rv" href="#/showrooms">${t('nav.showrooms')} <span class="arr">→</span></a></div>
      <div class="stores">${S.stores.map((s, i) => `<div class="store rv d${i}"><h3>${city(s.id)}</h3><span>${esc(s.address)}</span><a href="${tel(s.phone)}">${esc(s.phone)}</a>${status(s.id)}</div>`).join('')}</div>
    </div></section>`;

  P.brands = () => `
    <section class="sec" style="padding-bottom:clamp(48px,6vw,88px)"><div class="wrap">
      <div class="head" style="margin-bottom:0"><div><h1 class="rv d1 display">${t('houses.title')}</h1></div><p class="rv d2">${t('houses.sub')}</p></div>
    </div></section>
    <section style="padding-bottom:clamp(96px,12vw,180px)"><div class="wrap">
      <div class="house-grid">${houses.map((h) => `<a class="house-tile rv wipe" href="#/brand/${h.id}">${img(h.cover.lg, h.name)}<div class="t"><h2>${esc(h.name)}</h2><span class="eyebrow">${esc(origin(h))}<br>${t('houses.pieces', { n: h.products.length })}</span></div></a>`).join('')}</div>
      <div style="margin-top:clamp(64px,8vw,120px)">${alsoList()}</div>
    </div></section>`;

  P.brand = (id, q) => {
    const h = byId[id];
    if (!h) return P.missing();
    if (!h.featured) return P.brands();
    const cats = [...new Set(h.products.map((p) => p.category))];
    const active = cats.includes(q.get('c')) ? q.get('c') : '';
    const list = h.products.filter((p) => !active || p.category === active);
    const next = houses[(houses.indexOf(h) + 1) % houses.length];
    const bandImg = (h.products.find((p) => p.category === 'Beds') || h.products.at(-1)).img.lg;
    return `
    <section class="b-hero"><div class="b-media">${img(h.cover.lg, h.name, 'fetchpriority="high" loading="eager"')}</div><div class="wrap">
      <span class="eyebrow fade-in"><a href="#/brands">${t('houses.eyebrow')}</a> &nbsp;/&nbsp; ${esc(country(h.origin))}${h.founded ? ` · ${t('brand.since', { y: h.founded })}` : ''}</span>
      <h1><span class="line-mask"><span>${esc(h.name)}</span></span></h1>
    </div></section>

    <section class="sec"><div class="wrap b-intro">
      <span class="eyebrow rv">${t('brand.house')}</span>
      <div><p class="lead rv d1">${esc(tx(h.intro))}</p>${h.website ? `<a class="link rv d2" href="${h.website}" target="_blank" rel="noopener">${t('brand.website')} <span class="arr">↗</span></a>` : ''}</div>
    </div></section>

    <div id="collection"></div>
    <nav class="filters" aria-label="${t('brand.collection')}"><div class="wrap">
      <button data-cat="" aria-pressed="${!active}">${t('brand.all')}<sup>${h.products.length}</sup></button>
      ${cats.map((c) => `<button data-cat="${c}" aria-pressed="${active === c}">${cat(c)}<sup>${h.products.filter((p) => p.category === c).length}</sup></button>`).join('')}
    </div></nav>
    <section style="padding-bottom:clamp(96px,12vw,180px)"><div class="wrap">
      <div class="grid" id="grid">${list.map((p, i) => card(p, h, i, id)).join('')}</div>
    </div></section>

    ${band(bandImg, t('brand.see', { brand: esc(h.name) }), t('brand.seeText'), h.id)}

    <a class="next-house" href="#/brand/${next.id}"><div class="b-media">${img(next.cover.lg, next.name)}</div><div class="wrap"><span class="eyebrow">${t('brand.next')}</span><h2>${esc(next.name)}</h2><span class="eyebrow" style="margin:18px 0 0">${esc(origin(next))}</span></div></a>`;
  };

  P.inspiration = () => `
    <section class="sec" style="padding-bottom:clamp(48px,6vw,88px)"><div class="wrap">
      <div class="head" style="margin-bottom:0"><div><span class="eyebrow rv">${t('insp.eyebrow')}</span><h1 class="rv d1 display">${t('insp.title')}</h1></div><p class="rv d2">${t('insp.sub')}</p></div>
    </div></section>
    <section style="padding-bottom:clamp(96px,12vw,180px)"><div class="wrap">
      <div class="house-grid">${projects.map((p) => projectTile(p)).join('')}</div>
    </div></section>`;

  P.project = (id) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return P.inspiration();
    const next = projects[(projects.indexOf(p) + 1) % projects.length];
    return `
    <section class="b-hero"><div class="b-media">${img(p.cover.lg, p.title, 'fetchpriority="high" loading="eager"')}</div><div class="wrap">
      <span class="eyebrow fade-in"><a href="#/inspiration">${t('insp.eyebrow')}</a> &nbsp;/&nbsp; ${t('insp.photos', { n: p.images.length })}</span>
      <h1><span class="line-mask"><span>${esc(p.title)}</span></span></h1>
    </div></section>
    <section class="sec"><div class="wrap">
      ${p.description ? `<div class="project-intro"><span class="eyebrow">${t('insp.about')}</span><div class="project-copy">${(p.description[lang] || p.description.en).map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}
        ${p.collaboration ? `<p class="project-credit"><span>${t('insp.collaboration')}</span><a href="${esc(p.collaboration.url)}" target="_blank" rel="noopener noreferrer">${esc(p.collaboration.name)} <span aria-hidden="true">↗</span></a></p>` : ''}
      </div></div>` : ''}
      <div class="masonry" id="photos">${p.images.map((im, i) => `<button class="rv wipe" data-photo="${i}" aria-label="${esc(p.title)} ${i + 1}" style="aspect-ratio:${im.w}/${im.h}">${img(im.sm, `${p.title} ${i + 1}`)}</button>`).join('')}</div>
    </div></section>
    ${band(pick('porada', /klem/i, 'Sofas').lg)}
    ${next && next !== p ? `<a class="next-house" href="#/inspiration/${next.id}"><div class="b-media">${img(next.cover.lg, next.title)}</div><div class="wrap"><span class="eyebrow">${t('insp.next')}</span><h2>${esc(next.title)}</h2></div></a>` : ''}`;
  };

  P.showrooms = () => `
    <section class="sec" style="padding-bottom:clamp(48px,6vw,88px)"><div class="wrap">
      <span class="eyebrow rv">${t('stores.eyebrow')}</span><h1 class="rv d1 display" style="margin-top:22px">${t('stores.title')}</h1>
    </div></section>
    <section style="padding-bottom:clamp(96px,12vw,180px)"><div class="wrap">
      ${S.stores.map((s) => `<article class="store-full rv" id="s-${s.id}">
        <div><h2>${city(s.id)}</h2>${status(s.id)}
          <div class="store-actions"><button class="link" data-book data-store="${s.id}">${t('nav.book')} <span class="arr">→</span></button><a class="link" href="${maps(s.address)}" target="_blank" rel="noopener">${t('stores.directions')} <span class="arr">↗</span></a></div></div>
        <div class="col"><span class="eyebrow">${t('stores.showroom')}</span><span>${esc(s.address)}</span><a href="${tel(s.phone)}">${esc(s.phone)}</a><a href="mailto:${s.email}">${esc(s.email)}</a>
          <span class="eyebrow">${t('stores.natuzzi')}</span><span>${esc(s.natuzzi.address || t('stores.natuzziSame'))}</span>${s.natuzzi.phone ? `<a href="${tel(s.natuzzi.phone)}">${esc(s.natuzzi.phone)}</a>` : ''}</div>
        <div class="col"><span class="eyebrow">${t('stores.hours')}</span>${hoursTable(s.id)}<span class="muted" style="font-size:12.5px;margin-top:10px">${t('stores.note')}</span></div>
      </article>`).join('')}
      <p class="rv muted" style="margin-top:40px">${t('stores.head')} — ${esc(S.headOffice.address)} · <a href="${tel(S.headOffice.phone)}">${S.headOffice.phone}</a> · <a href="mailto:${S.headOffice.email}">${S.headOffice.email}</a></p>
    </div></section>`;

  P.story = () => `
    <section class="sec"><div class="wrap story-intro">
      <div><span class="eyebrow">${t('about.eyebrow')}</span><h1>${t('about.title')}</h1></div>
      <div class="story-summary"><p>${t('about.p1')}</p><p>${t('about.p2')}</p></div>
    </div></section>
    <section class="sec" style="padding-top:0"><div class="wrap">
      <h2 class="eyebrow history-heading">${t('about.timeline')}</h2>
      <div class="history-list">${(CAT.history || []).map((entry, i) => `<article class="history-card">
        <div class="history-photo">${img(entry.img.sm, '', `width="${entry.img.w}" height="${entry.img.h}"`)}</div>
        <div class="history-caption"><h3>${esc(tx(entry.period))}</h3><p>${esc(tx(entry.caption))}</p></div>
      </article>`).join('')}</div>
    </div></section>
    ${band(pick('natuzzi-italia', /botanic/i, 'Armchairs').lg)}`;

  P.missing = () => `<section class="sec"><div class="wrap"><h1 class="title">404</h1><p style="margin-top:24px"><a class="link" href="#/">TAF <span class="arr">→</span></a></p></div></section>`;

  /* ---------- router ---------- */
  const main = $('#main');
  const header = $('#header');
  let query = new URLSearchParams();
  const parse = () => { const [p, qs = ''] = (location.hash.replace(/^#\/?/, '') || '').split('?'); return { parts: p.split('/').filter(Boolean), q: new URLSearchParams(qs) }; };
  const NAV_FOR = { brand: 'brands', inspiration: 'inspiration' };

  function render(keep) {
    if (/^#\/houses?\b/.test(location.hash)) history.replaceState(null, '', location.hash.replace('#/houses', '#/brands').replace('#/house/', '#/brand/'));
    clearInterval(heroTimer); stopPicks();
    const { parts: [a, b], q } = parse();
    query = q;
    const pages = { undefined: () => P.home(), brands: () => P.brands(), brand: () => P.brand(b, q), inspiration: () => (b ? P.project(b) : P.inspiration()), showrooms: () => P.showrooms(), story: () => P.story() };
    main.classList.remove('ready');
    main.innerHTML = (pages[a] || P.missing)();
    document.body.classList.toggle('on-hero', !!$('.hero, .b-hero', main));
    document.body.classList.toggle('on-home', !a);
    const proj = a === 'inspiration' && b && projects.find((x) => x.id === b);
    document.title = a === 'brand' && byId[b] ? `${byId[b].name} — Takis Angelides Furnihome`
      : proj ? `${proj.title} — Takis Angelides Furnihome`
      : `Takis Angelides Furnihome${a ? ' — ' + t({ brands: 'nav.houses', inspiration: 'nav.inspiration', showrooms: 'nav.showrooms', story: 'nav.about' }[a] || 'nav.houses') : ' — ' + t('hero.l1') + ' ' + t('hero.l2')}`;
    $$('.nav a[href^="#/"]').forEach((l) => l.classList.toggle('on', l.getAttribute('href') === `#/${NAV_FOR[a] || a}`));
    closeMenu();
    if (!keep) window.scrollTo({ top: 0, behavior: 'instant' });
    onScroll();
    requestAnimationFrame(() => requestAnimationFrame(() => { main.classList.add('ready'); }));
    markLoadedImages();
    if (!a) { startHero(); houseHover(); startPicks(); }
  }
  function route(keep = false) {
    render(keep);
  }

  /* ---------- scroll-driven behaviours ---------- */
  function markLoadedImages() {
    $$('img').forEach((i) => { if (i.complete && i.naturalWidth) i.classList.add('ld'); });
  }
  function onScroll() {
    const hero = $('.hero, .b-hero', main);
    const bounds = hero?.getBoundingClientRect();
    header.classList.toggle('solid', !hero || scrollY > 64);
    // Only the opening photograph moves; the following sections scroll normally.
    if (hero?.classList.contains('hero')) {
      const offset = reduced ? 0 : Math.min(Math.max(-bounds.top, 0), bounds.height) * .6;
      hero.style.setProperty('--hero-shift', `${offset}px`);
    }
  }
  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
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
      slides[i].classList.remove('on'); dots[i].classList.remove('on');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('on'); void dots[i].offsetWidth; dots[i].classList.add('on');
      const nm = $('#heroName'), mt = $('#heroMeta');
      nm.classList.add('swap'); mt.classList.add('swap');
      $('#heroCount').textContent = `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      $('#heroLink').setAttribute('href', `#/brand/${heroHouses[i].id}`);
      setTimeout(() => { if (!nm.isConnected) return; nm.textContent = heroHouses[i].name; mt.textContent = origin(heroHouses[i]); nm.classList.remove('swap'); mt.classList.remove('swap'); }, 250);
    };
    const tick = () => go(i + 1);
    heroTimer = setInterval(tick, DUR);
    dots.forEach((d) => d.onclick = () => { clearInterval(heroTimer); go(+d.dataset.slide); heroTimer = setInterval(tick, DUR); });
  }
  function houseHover() {
    const figs = $$('.house-preview figure');
    $$('#houseList .house-row').forEach((row) => {
      const show = () => figs.forEach((f, k) => f.classList.toggle('on', k === +row.dataset.i));
      row.addEventListener('mouseenter', show); row.addEventListener('focus', show);
    });
  }

  /* ---------- manually controlled Selected pieces carousel ---------- */
  let stopPicks = () => {};
  function startPicks() {
    const track = $('#picks');
    if (!track) return;
    const buttons = $$('[data-picks-step]');
    const stride = () => track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      buttons[0].disabled = track.scrollLeft <= 2;
      buttons[1].disabled = track.scrollLeft >= max - 2;
      const first = Math.round(track.scrollLeft / stride());
      const visible = Math.round((track.clientWidth + parseFloat(getComputedStyle(track).columnGap)) / stride());
      const range = visible === 1 ? `${first + 1}` : `${first + 1}–${Math.min(pool.length, first + visible)}`;
      $('#picksCount').textContent = `${range} / ${pool.length}`;
    };
    const move = (direction) => {
      const visible = Math.round((track.clientWidth + parseFloat(getComputedStyle(track).columnGap)) / stride());
      track.scrollBy({ left: direction * stride() * visible, behavior: reduced ? 'instant' : 'smooth' });
    };
    buttons.forEach((button) => button.onclick = () => move(Number(button.dataset.picksStep)));
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.target !== track) return;
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'Home' || e.key === 'End') track.scrollTo({ left: e.key === 'Home' ? 0 : track.scrollWidth, behavior: reduced ? 'instant' : 'smooth' });
        else move(e.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    addEventListener('resize', update);
    stopPicks = () => removeEventListener('resize', update);
    update();
  }

  const menuBtn = $('#menuBtn');
  function closeMenu() { setContact(false); document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', t('nav.menu')); document.body.style.overflow = ''; }

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
          <button class="btn" data-book data-interest="${b.id}" data-piece-name="${esc(productName(p))}">${t('nav.book')}</button>
          ${site ? `<a class="btn ghost" href="${esc(site)}" target="_blank" rel="noopener">${t('piece.visit')} <span aria-hidden="true">↗</span></a>` : ''}
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
  pv.addEventListener('touchstart', (e) => { if (e.target.closest('.pv-img')) tx0 = e.touches[0].clientX; }, { passive: true });
  pv.addEventListener('touchend', (e) => { if (tx0 === null) return; const dx = e.changedTouches[0].clientX - tx0; tx0 = null; if (Math.abs(dx) > 40 && pvList.length > 1) step(dx < 0 ? 1 : -1); });

  /* ---------- booking ---------- */
  const sheet = $('#book');
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
  function openBook(o = {}) {
    Object.assign(bk, { time: '' }, o);
    if (o.pieceName) bk.notes = o.pieceName;
    if (bk.date && !availableDate(new Date(bk.date + 'T12:00'))) bk.date = '';
    calendarMonth = new Date((bk.date || iso(dateLimits().min)) + 'T12:00');
    renderBook(); if (pv.open) pv.close(); if (!sheet.open) sheet.showModal();
  }
  function renderBook(bad = '') {
    const sl = slots();
    sheet.innerHTML = `<button class="x" data-close aria-label="${t('book.close')}"></button>
      <form id="bookForm" novalidate>
        <div><h2 id="bookTitle">${t('book.title')}</h2><p class="sub">${t('book.sub')}</p></div>
        <div class="f"><span class="lbl">${t('book.store')}</span><div class="chips">${S.stores.map((s) => `<button type="button" data-store-pick="${s.id}" aria-pressed="${bk.store === s.id}">${city(s.id)}</button>`).join('')}</div></div>
        <div class="f"><span class="lbl" id="interestLabel">${t('book.interest')}</span><input id="bInterest" type="hidden" value="${esc(bk.interest)}">
          <details class="booking-picker" id="interestPicker"><summary aria-labelledby="interestLabel interestValue"><span id="interestValue">${esc(byId[bk.interest]?.name || t('book.any'))}</span><span class="picker-chevron" aria-hidden="true"></span></summary>
            <div class="picker-panel interest-options" role="group" aria-labelledby="interestLabel">${[{ id: '', name: t('book.any') }, ...CAT.brands].map((b) => `<button type="button" data-interest-pick="${b.id}" aria-pressed="${bk.interest === b.id}"><span>${esc(b.name)}</span><span aria-hidden="true">${bk.interest === b.id ? '✓' : ''}</span></button>`).join('')}</div>
          </details></div>
        <div class="f ${bad === 'date' ? 'bad' : ''}"><span class="lbl" id="dateLabel">${t('book.date')}</span>
          <details class="booking-picker" id="datePicker"><summary id="bDate" aria-labelledby="dateLabel dateValue"><span id="dateValue" class="${bk.date ? '' : 'muted'}">${bk.date ? esc(new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(bk.date + 'T12:00'))) : t('book.pickDate')}</span><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M7 2v6m10-6v6M3 11h18"/></svg></summary>
            <div class="picker-panel calendar" id="calendar" role="group" aria-labelledby="dateLabel">${calendar()}</div>
          </details></div>
        <div class="f ${bad === 'time' ? 'bad' : ''}"><span class="lbl">${t('book.time')}</span><div class="chips">${sl === null ? `<span class="hint">${t('book.pickDate')}</span>` : sl.length ? sl.map((s) => `<button type="button" data-slot="${s}" aria-pressed="${bk.time === s}">${s}</button>`).join('') : `<span class="hint">${t('book.closedDay')}</span>`}</div></div>
        <div class="f-row"><div class="f ${bad === 'name' ? 'bad' : ''}"><label for="bName">${t('book.name')}</label><input id="bName" autocomplete="name" value="${esc(bk.name)}"></div>
          <div class="f ${bad === 'phone' ? 'bad' : ''}"><label for="bPhone">${t('book.phone')}</label><input id="bPhone" type="tel" autocomplete="tel" placeholder="+357" value="${esc(bk.phone)}"></div></div>
        <div class="f"><label for="bEmail">${t('book.email')}</label><input id="bEmail" type="email" autocomplete="email" value="${esc(bk.email)}"></div>
        <div class="f"><label for="bNotes">${t('book.notes')}</label><textarea id="bNotes" placeholder="${t('book.notesPh')}">${esc(bk.notes)}</textarea></div>
        <div class="foot"><button class="btn" type="submit">${t('book.send')}</button><span class="note">${t('book.demo')}</span></div>
      </form>`;
  }
  const keep = () => { for (const [k, id] of [['interest', 'bInterest'], ['name', 'bName'], ['phone', 'bPhone'], ['email', 'bEmail'], ['notes', 'bNotes']]) { const el = $('#' + id, sheet); if (el) bk[k] = el.value; } };
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet || e.target.closest('[data-close]')) return sheet.close();
    $$('.booking-picker[open]', sheet).forEach((p) => { if (!p.contains(e.target)) p.open = false; });
    const interest = e.target.closest('[data-interest-pick]');
    if (interest) { keep(); bk.interest = interest.dataset.interestPick; renderBook(); $('#interestPicker summary', sheet).focus(); return; }
    const month = e.target.closest('[data-month]');
    if (month) {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + Number(month.dataset.month), 1, 12);
      $('#calendar', sheet).innerHTML = calendar();
      const next = $(`[data-month="${month.dataset.month}"]`, sheet);
      (next.disabled ? $(`[data-month="${-Number(month.dataset.month)}"]`, sheet) : next).focus(); return;
    }
    const date = e.target.closest('[data-date]');
    if (date && availableDate(new Date(date.dataset.date + 'T12:00'))) { keep(); bk.date = date.dataset.date; bk.time = ''; renderBook(); $('#bDate', sheet).focus(); return; }
    const s = e.target.closest('[data-store-pick]'); if (s) { keep(); bk.store = s.dataset.storePick; bk.time = ''; if (bk.date && !availableDate(new Date(bk.date + 'T12:00'))) bk.date = ''; renderBook(); $(`[data-store-pick="${bk.store}"]`, sheet).focus(); return; }
    const sl = e.target.closest('[data-slot]'); if (sl) { keep(); bk.time = sl.dataset.slot; renderBook(); }
  });
  sheet.addEventListener('cancel', (e) => {
    const picker = $('.booking-picker[open]', sheet);
    if (picker) { e.preventDefault(); picker.open = false; $('summary', picker).focus(); }
  });
  sheet.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.id === 'contactForm') { validateContact(e.target); return; }
    keep();
    const bad = !bk.date || !availableDate(new Date(bk.date + 'T12:00')) ? 'date' : !slots()?.includes(bk.time) ? 'time' : !bk.name.trim() ? 'name' : !bk.phone.trim() ? 'phone' : '';
    if (bad) { renderBook(bad); $('.f.bad summary, .f.bad input, .f.bad button', sheet)?.focus(); return; }
    const date = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(bk.date + 'T12:00'));
    $('#bookForm', sheet).outerHTML = `<div class="done"><span class="eyebrow">${t('book.title')}</span><h2>${esc(t('book.okTitle', { name: bk.name.trim().split(/\s+/)[0] }))}</h2><p class="sub">${esc(t('book.okText', { store: city(bk.store), date, time: bk.time }))}</p><p class="note">${t('book.demo')}</p><div><button class="btn" data-close>${t('book.close')}</button></div></div>`;
  });

  /* ---------- chrome ---------- */
  const contactMenu = $('#contactMenu');
  const contactOptions = $('#contactOptions');
  let contactPinned = false;
  function setContact(open, pinned = false) {
    contactOptions.hidden = !open;
    contactPinned = open && pinned;
    $$('[data-contact-toggle]').forEach((button) => button.setAttribute('aria-expanded', String(open)));
  }
  contactMenu.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setContact(true, contactPinned); });
  contactMenu.addEventListener('pointerleave', () => {
    if (!contactPinned && !contactMenu.contains(document.activeElement)) setContact(false);
  });
  contactMenu.addEventListener('focusout', () => {
    setTimeout(() => { if (!contactMenu.contains(document.activeElement)) setContact(false); }, 0);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !contactOptions.hidden) { setContact(false); $('#contactTrigger').focus(); }
  });
  addEventListener('resize', () => {
    if (innerWidth > 1280 && document.body.classList.contains('menu-open')) closeMenu();
    if (innerWidth <= 1280) setContact(false);
  });
  const contactDraft = { name: '', subject: '', phone: '', email: '', message: '' };
  sheet.addEventListener('input', (e) => {
    if (e.target.closest('#contactForm') && Object.hasOwn(contactDraft, e.target.name)) contactDraft[e.target.name] = e.target.value;
  });
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
  function openContact() {
    if (pv.open) pv.close();
    sheet.innerHTML = `<button class="x" data-close aria-label="${t('book.close')}"></button>
      <div class="contact-body"><div><h2 id="bookTitle">${t('nav.contactUs')}</h2><p class="sub">${t('contact.sub')}</p></div>
        <div class="contact-methods"><a href="mailto:${esc(S.headOffice.email)}"><span class="eyebrow">${t('contact.email')}</span><span>${esc(S.headOffice.email)}</span></a></div>
        <form id="contactForm" class="contact-form" novalidate aria-describedby="contactDemo">
          <div class="f-row"><div class="f"><label for="cName">${t('contact.name')}</label><input id="cName" name="name" autocomplete="name" maxlength="120" required value="${esc(contactDraft.name)}"></div>
            <div class="f"><label for="cSubject">${t('contact.subject')}</label><input id="cSubject" name="subject" maxlength="160" required value="${esc(contactDraft.subject)}"></div></div>
          <div class="f-row"><div class="f"><label for="cPhone">${t('contact.phoneField')}</label><div class="contact-phone"><span>+357</span><input id="cPhone" name="phone" type="tel" autocomplete="tel-national" maxlength="32" value="${esc(contactDraft.phone)}"></div></div>
            <div class="f"><label for="cEmail">${t('contact.emailField')}</label><input id="cEmail" name="email" type="email" autocomplete="email" maxlength="254" required value="${esc(contactDraft.email)}"></div></div>
          <div class="f"><label for="cMessage">${t('contact.message')}</label><textarea id="cMessage" name="message" maxlength="5000" rows="5" required>${esc(contactDraft.message)}</textarea></div>
          <div class="contact-submit"><button class="btn" type="submit">${t('contact.send')}</button><p class="note" id="contactDemo">${t('contact.demo')}</p><p id="contactStatus" class="contact-status" role="status" aria-live="polite"></p></div>
        </form>
        <div class="contact-methods"><a href="${tel(S.headOffice.phone)}"><span class="eyebrow">${t('contact.call')}</span><span>${esc(S.headOffice.phone)}</span></a></div>
        <div class="contact-stores"><h3 class="eyebrow">${t('nav.showrooms')}</h3>${S.stores.map((s) => `<div><span>${city(s.id)}</span><a href="${tel(s.phone)}">${esc(s.phone)}</a></div>`).join('')}
          <a class="link" href="#/showrooms" data-close>${t('contact.showrooms')} <span aria-hidden="true">→</span></a></div>
        <div class="contact-book"><p>${t('contact.appointment')}</p><button class="btn" data-book>${t('nav.book')}</button></div>
      </div>`;
    if (!sheet.open) sheet.showModal();
  }
  function chrome() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $('#lang').innerHTML = S.languages.map((l) => `<button data-lang="${l.code}" lang="${l.code}" title="${l.name}" aria-pressed="${l.code === lang}">${l.label}</button>`).join('');
    if (!$('#navActions')) $('#nav').insertAdjacentHTML('beforeend', '<div class="nav-actions" id="navActions"><button type="button" data-book></button><button type="button" data-contact></button></div>');
    $('#navActions [data-book]').textContent = t('nav.book');
    $('#navActions [data-contact]').textContent = t('nav.contactUs');
    $('#contactTrigger').setAttribute('aria-label', t('nav.contact'));
    menuBtn.setAttribute('aria-label', t('nav.menu'));
    const allBrands = [...CAT.brands].sort((a, b) => a.name.localeCompare(b.name));
    $('#footer').innerHTML = `<div class="wrap">
      <div class="f-grid">
        <div class="f-identity"><img src="img/logos/taf-white.svg" alt="Takis Angelides Furnihome"><p>${t('footer.tag')}</p></div>
        <div class="f-brands"><h4>${t('houses.eyebrow')}</h4><ul>${allBrands.map((b) => `<li>${b.website
          ? `<a href="${esc(b.website)}" target="_blank" rel="noopener noreferrer">${esc(b.name)} <span aria-hidden="true">↗</span></a>` : `<span>${esc(b.name)}</span>`}</li>`).join('')}</ul></div>
        <div><h4>${t('nav.showrooms')}</h4><ul>${S.stores.map((s) => `<li><a href="#/showrooms">${city(s.id)}</a> · <a href="${tel(s.phone)}">${s.phone.replace('+357 ', '')}</a></li>`).join('')}</ul></div>
        <div><h4>TAF</h4><ul><li><a href="#/inspiration">${t('nav.inspiration')}</a></li><li><a href="#/story">${t('nav.about')}</a></li></ul></div>
        <div><h4>Social</h4><ul><li><a href="${S.social.instagram}" target="_blank" rel="noopener">Instagram</a></li><li><a href="${S.social.facebook}" target="_blank" rel="noopener">Facebook</a></li></ul></div>
      </div>
      <div class="f-bottom"><span>© ${new Date().getFullYear()} Takis Angelides Furnihome Ltd. ${t('footer.rights')}</span><span>${S.stores.map((s) => city(s.id)).join(' · ')}</span></div>
    </div>`;
  }

  document.addEventListener('click', (e) => {
    const l = e.target.closest('[data-lang]');
    if (l) { lang = l.dataset.lang; store.set('taf.lang', lang); chrome(); route(true); return; }
    const contactToggle = e.target.closest('[data-contact-toggle]');
    if (contactToggle) {
      const open = !contactPinned; closeMenu(); setContact(open, open);
      if (open && e.detail === 0) $('button', contactOptions).focus();
      return;
    }
    if (!e.target.closest('#contactMenu')) setContact(false);
    if (e.target.closest('[data-contact]')) { closeMenu(); openContact(); return; }
    const b = e.target.closest('[data-book]');
    if (b) { e.preventDefault(); closeMenu(); openBook({ store: b.dataset.store || bk.store, interest: b.dataset.interest ?? bk.interest, pieceName: b.dataset.pieceName }); return; }
    const c = e.target.closest('[data-piece]');
    if (c) { const [bid, category, n] = c.dataset.piece.split('|'); openPiece(bid, category, n, c.dataset.list); return; }
    const ph = e.target.closest('[data-photo]');
    if (ph) { openPhoto(+ph.dataset.photo); return; }
    const f = e.target.closest('[data-cat]');
    if (f) {
      const { parts } = parse(); const q = new URLSearchParams(query); f.dataset.cat ? q.set('c', f.dataset.cat) : q.delete('c');
      history.replaceState(null, '', `#/${parts.join('/')}${q.toString() ? '?' + q : ''}`);
      query = q;
      const h = byId[parts[1]]; const active = f.dataset.cat;
      $$('.filters [data-cat]').forEach((x) => x.setAttribute('aria-pressed', x === f));
      const grid = $('#grid');
      grid.classList.add('out');
      setTimeout(() => {
        grid.innerHTML = h.products.filter((p) => !active || p.category === active).map((p, i) => card(p, h, i, h.id)).join('');
        grid.classList.remove('out'); markLoadedImages();
      }, 260);
      const y = $('#collection').getBoundingClientRect().top + scrollY - header.offsetHeight;
      if (scrollY > y) scrollTo({ top: y, behavior: 'smooth' });
      return;
    }
    if (e.target.closest('#menuBtn')) {
      const open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', t(open ? 'nav.close' : 'nav.menu'));
      document.body.style.overflow = open ? 'hidden' : '';
    }
  });
  addEventListener('hashchange', () => route());
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu(); });

  chrome();
  route();
})();
