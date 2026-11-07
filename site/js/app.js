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
  const origin = (b) => [country(b.origin), b.founded].filter(Boolean).join(' · ');

  /* ---------- data ---------- */
  const houses = CAT.brands.filter((b) => b.featured);
  const others = CAT.brands.filter((b) => !b.featured);
  const projects = CAT.inspiration || [];
  const byId = Object.fromEntries(CAT.brands.map((b) => [b.id, b]));
  const findPiece = (brand, name) => byId[brand]?.products.find((p) => p.name === name);
  // a product photo by brand + name pattern (falls back to a category, then the first product)
  const pick = (brand, test, fallbackCat) => {
    const b = byId[brand] || houses[0];
    return (b.products.find((p) => test.test(p.name)) || b.products.find((p) => p.category === fallbackCat) || b.products[0]).img;
  };
  // pool for the rotating "Selected pieces": all products, brands interleaved, shuffled once per visit
  const pool = (() => {
    const lists = houses.map((h) => h.products.map((p) => ({ ...p, brand: h })).sort(() => Math.random() - 0.5));
    const out = [];
    for (let i = 0; out.length < lists.reduce((n, l) => n + l.length, 0); i++) for (const l of lists) if (l[i]) out.push(l[i]);
    return out;
  })();
  let shown = pool.slice(0, 4);

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
  const card = (p, brand, i, list) => `<button class="card" data-piece="${brand.id}|${esc(p.name)}" data-list="${list}" style="--d:${Math.min(i, 8) * 70}ms">
      <div class="ph wipe">${img(p.img.card, `${p.name} — ${brand.name}`)}</div>
      <div class="cap"><h3>${esc(p.name)}</h3><span class="sm">${list === 'sel' ? esc(brand.name) : cat(p.category)}</span></div>
    </button>`;
  const marquee = () => {
    const names = CAT.brands.map((b) => `<span>${esc(b.name)}</span><i>✦</i>`).join('');
    return `<div class="marquee" aria-hidden="true"><div class="marquee-track">${names}${names}</div></div>`;
  };
  const alsoList = () => `<div class="also rv"><span class="eyebrow">${t('houses.also')}</span><ul>${others.map((b) => `<li>${b.website ? `<a href="${b.website}" target="_blank" rel="noopener">${esc(b.name)}</a>` : esc(b.name)}<span> — ${esc(country(b.origin))}${b.speciality ? `, ${esc(tx(b.speciality))}` : ''}</span></li>`).join('')}</ul></div>`;
  const projectTile = (p, cls = '') => `<a class="house-tile rv wipe ${cls}" href="#/inspiration/${p.id}">${img(p.cover.lg, p.title)}<div class="t"><h2>${esc(p.title)}</h2><span class="eyebrow">${t('insp.photos', { n: p.images.length })}</span></div></a>`;

  /* ---------- pages ---------- */
  const P = {};

  P.home = () => `
    <section class="hero" aria-label="TAF">
      <div class="hero-media" data-parallax="0.25">${houses.map((h, i) => `<div class="hero-img${i === 0 ? ' on' : ''}"><img src="${h.cover.lg}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></div>`).join('')}</div>
      <div class="hero-body"><div class="wrap">
        <h1><span class="line-mask"><span>${t('hero.l1')}</span></span><span class="line-mask"><span><em>${t('hero.l2')}</em></span></span></h1>
        <div class="hero-actions fade-in"><a class="btn light" href="#/brands">${t('hero.discover')}</a><button class="link" data-book style="color:#fff">${t('nav.book')} <span class="arr">→</span></button></div>
      </div></div>
      <div class="hero-bar fade-in"><div class="wrap"><div class="hero-bar-in">
        <a class="hero-caption" id="heroLink" href="#/brand/${houses[0].id}" aria-live="polite"><b id="heroName">${esc(houses[0].name)}</b><span id="heroMeta">${esc(origin(houses[0]))}</span></a>
        <div class="hero-progress"><span class="hero-count" id="heroCount">01 / ${String(houses.length).padStart(2, '0')}</span>${houses.map((h, i) => `<button class="${i === 0 ? 'on' : ''}" data-slide="${i}" aria-label="${esc(h.name)}"></button>`).join('')}</div>
      </div></div></div>
    </section>

    <section class="sec"><div class="wrap"><div class="statement">
      <span class="eyebrow rv">${t('intro.eyebrow')} · 1965 — ${new Date().getFullYear()}</span>
      <p class="lead rv d1">${t('intro.text')}</p>
      <a class="link rv d2" href="#/story">${t('intro.link')} <span class="arr">→</span></a>
    </div></div></section>

    ${marquee()}

    <section class="sec"><div class="wrap">
      <div class="head"><div><span class="eyebrow rv">${t('houses.eyebrow')}</span><h2 class="title rv d1">${t('houses.title')}</h2></div><p class="rv d2">${t('houses.sub')}</p></div>
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
      <div class="head"><div><span class="eyebrow rv">${t('selected.eyebrow')}</span><h2 class="title rv d1">${t('selected.title')}</h2></div></div>
      <div class="grid four picks" id="picks">${shown.map((p, i) => card(p, p.brand, i, 'sel')).join('')}</div>
    </div></section>

    ${projects.length ? `<section class="sec" style="padding-top:0"><div class="wrap">
      <div class="head"><div><span class="eyebrow rv">${t('insp.eyebrow')}</span><h2 class="title rv d1">${t('insp.title')}</h2></div><a class="link rv" href="#/inspiration">${t('insp.all')} <span class="arr">→</span></a></div>
      <div class="house-grid insp-teaser">${projects.slice(0, 3).map((p) => projectTile(p)).join('')}</div>
    </div></section>` : ''}

    ${band(pick('poliform', /dream/i, 'Beds').lg)}
    ${storesStrip()}`;

  const band = (src, title = t('visit.title'), text = t('visit.text'), interest = '') => `
    <section class="band rv"><div class="band-media" data-parallax="0.18">${img(src, '')}</div><div class="wrap">
      <span class="eyebrow">${t('visit.eyebrow')}</span><h2>${title}</h2><p>${text}</p>
      <button class="btn light" data-book ${interest ? `data-interest="${interest}"` : ''}>${t('nav.book')}</button></div></section>`;

  const storesStrip = () => `
    <section class="sec-tight"><div class="wrap">
      <div class="head"><div><span class="eyebrow rv">${t('stores.eyebrow')}</span><h2 class="title rv d1">${t('stores.title')}</h2></div><a class="link rv" href="#/showrooms">${t('nav.showrooms')} <span class="arr">→</span></a></div>
      <div class="stores">${S.stores.map((s, i) => `<div class="store rv d${i}"><h3>${city(s.id)}</h3><span>${esc(s.address)}</span><a href="${tel(s.phone)}">${esc(s.phone)}</a>${status(s.id)}</div>`).join('')}</div>
    </div></section>`;

  P.brands = () => `
    <section class="sec" style="padding-bottom:clamp(48px,6vw,88px)"><div class="wrap">
      <div class="head" style="margin-bottom:0"><div><span class="eyebrow rv">${t('houses.eyebrow')}</span><h1 class="rv d1 display">${t('houses.title')}</h1></div><p class="rv d2">${t('houses.sub')}</p></div>
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
    <section class="b-hero"><div class="b-media" data-parallax="0.3">${img(h.cover.lg, h.name, 'fetchpriority="high" loading="eager"')}</div><div class="wrap">
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

    <a class="next-house" href="#/brand/${next.id}"><div class="b-media" data-parallax="0.15">${img(next.cover.lg, next.name)}</div><div class="wrap"><span class="eyebrow">${t('brand.next')}</span><h2>${esc(next.name)}</h2><span class="eyebrow" style="margin:18px 0 0">${esc(origin(next))}</span></div></a>`;
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
    <section class="b-hero"><div class="b-media" data-parallax="0.3">${img(p.cover.lg, p.title, 'fetchpriority="high" loading="eager"')}</div><div class="wrap">
      <span class="eyebrow fade-in"><a href="#/inspiration">${t('insp.eyebrow')}</a> &nbsp;/&nbsp; ${t('insp.photos', { n: p.images.length })}</span>
      <h1><span class="line-mask"><span>${esc(p.title)}</span></span></h1>
    </div></section>
    <section class="sec"><div class="wrap">
      <div class="masonry" id="photos">${p.images.map((im, i) => `<button class="rv wipe" data-photo="${i}" aria-label="${esc(p.title)} ${i + 1}" style="aspect-ratio:${im.w}/${im.h}">${img(im.sm, `${p.title} ${i + 1}`)}</button>`).join('')}</div>
    </div></section>
    ${band(pick('porada', /klem/i, 'Sofas').lg)}
    ${next && next !== p ? `<a class="next-house" href="#/inspiration/${next.id}"><div class="b-media" data-parallax="0.15">${img(next.cover.lg, next.title)}</div><div class="wrap"><span class="eyebrow">${t('insp.next')}</span><h2>${esc(next.title)}</h2></div></a>` : ''}`;
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
    <section class="sec"><div class="wrap story-grid">
      <div><span class="eyebrow rv">${t('about.eyebrow')}</span><h1 class="rv d1" style="font-size:clamp(46px,6vw,96px);font-weight:200;margin:22px 0 44px">${t('about.title')}</h1>
        <p class="rv d2">${t('about.p1')}</p><p class="rv d3">${t('about.p2')}</p></div>
      <div class="ph rv wipe">${img(pick('porada', /copine/i, 'Armchairs').lg, '')}</div>
    </div></section>
    <section class="sec" style="padding-top:0"><div class="wrap">
      <span class="eyebrow rv" style="margin-bottom:28px">${t('about.timeline')}</span>
      <div class="timeline"><ol>${S.timeline.map(([y, s]) => `<li class="rv"><b>${y === 'Today' ? new Date().getFullYear() : y}</b><span>${esc(tx(s))}</span></li>`).join('')}</ol></div>
    </div></section>
    ${band(pick('natuzzi-italia', /botanic/i, 'Armchairs').lg)}`;

  P.missing = () => `<section class="sec"><div class="wrap"><h1 class="title">404</h1><p style="margin-top:24px"><a class="link" href="#/">TAF <span class="arr">→</span></a></p></div></section>`;

  /* ---------- router (with a soft cross-fade between pages) ---------- */
  const main = $('#main');
  const header = $('#header');
  let query = new URLSearchParams();
  const parse = () => { const [p, qs = ''] = (location.hash.replace(/^#\/?/, '') || '').split('?'); return { parts: p.split('/').filter(Boolean), q: new URLSearchParams(qs) }; };
  let first = true;
  const NAV_FOR = { brand: 'brands', inspiration: 'inspiration' };

  function render(keep) {
    if (/^#\/houses?\b/.test(location.hash)) history.replaceState(null, '', location.hash.replace('#/houses', '#/brands').replace('#/house/', '#/brand/'));
    clearInterval(heroTimer); clearInterval(picksTimer);
    const { parts: [a, b], q } = parse();
    query = q;
    const pages = { undefined: () => P.home(), brands: () => P.brands(), brand: () => P.brand(b, q), inspiration: () => (b ? P.project(b) : P.inspiration()), showrooms: () => P.showrooms(), story: () => P.story() };
    main.classList.remove('ready');
    main.innerHTML = (pages[a] || P.missing)();
    document.body.classList.toggle('on-hero', !!$('.hero, .b-hero', main));
    const proj = a === 'inspiration' && b && projects.find((x) => x.id === b);
    document.title = a === 'brand' && byId[b] ? `${byId[b].name} — Takis Angelides Furnihome`
      : proj ? `${proj.title} — Takis Angelides Furnihome`
      : `Takis Angelides Furnihome${a ? ' — ' + t({ brands: 'nav.houses', inspiration: 'nav.inspiration', showrooms: 'nav.showrooms', story: 'nav.about' }[a] || 'nav.houses') : ' — ' + t('hero.l1') + ' ' + t('hero.l2')}`;
    $$('.nav a[href^="#/"]').forEach((l) => l.classList.toggle('on', l.getAttribute('href') === `#/${NAV_FOR[a] || a}`));
    closeMenu();
    if (!keep) window.scrollTo({ top: 0, behavior: 'instant' });
    lastY = scrollY; onScroll();
    requestAnimationFrame(() => requestAnimationFrame(() => { main.classList.add('ready'); main.classList.remove('out'); }));
    observe();
    if (!a) { startHero(); houseHover(); startPicks(); }
  }
  function route(keep = false) {
    if (first || keep || reduced) { first = false; return render(keep); }
    main.classList.add('out');
    setTimeout(() => render(false), 380);
  }

  /* ---------- scroll-driven behaviours ---------- */
  let io;
  function observe() {
    io?.disconnect();
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv:not(.in), .wipe:not(.in), .card:not(.in)').forEach((el) => io.observe(el));
    $$('img').forEach((i) => { if (i.complete && i.naturalWidth) i.classList.add('ld'); });
  }
  const revealFallback = () => { const lim = innerHeight * .96; for (const el of $$('.rv:not(.in), .wipe:not(.in), .card:not(.in)')) if (el.getBoundingClientRect().top < lim) el.classList.add('in'); };

  function parallax() {
    if (reduced) return;
    for (const el of $$('[data-parallax]', main)) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2) - innerHeight / 2) * -(+el.dataset.parallax) * 0.4}px, 0)`;
    }
  }

  let lastY = 0;
  function onScroll() {
    const y = scrollY;
    const hero = $('.hero, .b-hero', main);
    header.classList.toggle('solid', y > (hero ? hero.offsetHeight - 90 : -1));
    header.classList.toggle('hide', y > 500 && y > lastY + 2 && !document.body.classList.contains('menu-open'));
    if (y < lastY - 2) header.classList.remove('hide');
    lastY = y;
    revealFallback(); parallax();
  }
  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
  addEventListener('resize', parallax);
  setInterval(revealFallback, 800);

  let heroTimer;
  function startHero() {
    clearInterval(heroTimer);
    const slides = $$('.hero-img'); const dots = $$('.hero-progress button');
    if (slides.length < 2) return;
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
      $('#heroLink').setAttribute('href', `#/brand/${houses[i].id}`);
      setTimeout(() => { if (!nm.isConnected) return; nm.textContent = houses[i].name; mt.textContent = origin(houses[i]); nm.classList.remove('swap'); mt.classList.remove('swap'); }, 250);
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

  /* ---------- rotating "Selected pieces": one card changes at a time ---------- */
  let picksTimer, pickCursor = 4, pickSlot = 0;
  function startPicks() {
    clearInterval(picksTimer);
    const grid = $('#picks');
    if (!grid || pool.length <= 4 || reduced) return;
    let paused = false;
    grid.addEventListener('mouseenter', () => (paused = true));
    grid.addEventListener('mouseleave', () => (paused = false));
    picksTimer = setInterval(() => {
      if (!grid.isConnected) return clearInterval(picksTimer);
      if (paused || pv.open || document.hidden) return;
      // next product not already on screen
      let next; for (let k = 0; k < pool.length; k++) { next = pool[pickCursor++ % pool.length]; if (!shown.includes(next)) break; }
      const slot = pickSlot++ % 4;
      const el = grid.children[slot];
      if (!el || el.classList.contains('swap')) return;
      el.classList.add('swap');
      // preload, then swap after the fade-out; never wait more than 1.5s (background tabs can stall decoding)
      const pre = new Image(); pre.src = next.img.card;
      let done = false;
      const apply = () => { if (done) return; done = true; setTimeout(() => {
        if (!el.isConnected) return;
        shown[slot] = next;
        el.dataset.piece = `${next.brand.id}|${next.name}`;
        const im = $('img', el); im.src = next.img.card; im.alt = `${next.name} — ${next.brand.name}`;
        $('h3', el).textContent = next.name; $('.sm', el).textContent = next.brand.name;
        el.classList.remove('swap');
      }, 450); };
      pre.onload = pre.onerror = apply; setTimeout(apply, 1500);
    }, 3800);
  }

  const menuBtn = $('#menuBtn');
  function closeMenu() { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', t('nav.menu')); document.body.style.overflow = ''; }

  /* ---------- viewer: a product (photo + brand + category + two buttons) or an inspiration photo ---------- */
  const pv = $('#piece');
  let pvList = [], pvIdx = 0, pvMode = 'piece';
  function openPiece(brandId, name, listKey) {
    pvMode = 'piece';
    // the list is whatever cards are on screen (rotating picks or the brand grid)
    pvList = $$(listKey === 'sel' ? '#picks .card' : '#grid .card').map((c) => { const [bid, n] = c.dataset.piece.split('|'); return { p: findPiece(bid, n), b: byId[bid] }; });
    pvIdx = Math.max(0, pvList.findIndex((x) => x.p.name === name && x.b.id === brandId));
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
    const nav = n > 1 ? `<div class="pv-nav"><button data-step="-1" aria-label="Previous">←</button><span class="pv-count" aria-live="polite">${pvIdx + 1} / ${n}</span><button data-step="1" aria-label="Next">→</button></div>` : '';
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
      <div class="pv-img"><img src="${p.img.lg}" alt="${esc(p.name)} — ${esc(b.name)}">${nav}</div>
      <div class="pv-body">
        <h2>${esc(p.name)}</h2>
        <dl><dt>${t('piece.house')}</dt><dd><a href="#/brand/${b.id}" data-close>${esc(b.name)}</a></dd><dt>${t('piece.category')}</dt><dd>${cat(p.category)}</dd></dl>
        <div class="pv-actions">
          <button class="btn" data-book data-interest="${b.id}" data-piece-name="${esc(p.name)}">${t('nav.book')}</button>
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
  const slots = () => {
    if (!bk.date) return null;
    const out = [];
    for (const [a, b] of S.hours[bk.store][new Date(bk.date + 'T12:00').getDay()]) for (let m = toMin(a); m <= toMin(b) - 60; m += 30) out.push(`${String(m / 60 | 0).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    return out;
  };
  function openBook(o = {}) {
    Object.assign(bk, { time: '' }, o);
    if (o.pieceName) bk.notes = o.pieceName;
    renderBook(); if (pv.open) pv.close(); sheet.showModal();
  }
  function renderBook(bad = '') {
    const min = new Date(); min.setDate(min.getDate() + 1); const max = new Date(); max.setDate(max.getDate() + 90);
    const sl = slots();
    sheet.innerHTML = `<button class="x" data-close aria-label="${t('book.close')}"></button>
      <form id="bookForm" novalidate>
        <div><h2 id="bookTitle">${t('book.title')}</h2><p class="sub">${t('book.sub')}</p></div>
        <div class="f"><span class="lbl">${t('book.store')}</span><div class="chips">${S.stores.map((s) => `<button type="button" data-store-pick="${s.id}" aria-pressed="${bk.store === s.id}">${city(s.id)}</button>`).join('')}</div></div>
        <div class="f"><label for="bInterest">${t('book.interest')}</label><select id="bInterest"><option value="">${t('book.any')}</option>${CAT.brands.map((b) => `<option value="${b.id}" ${bk.interest === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>
        <div class="f ${bad === 'date' ? 'bad' : ''}"><label for="bDate">${t('book.date')}</label><input id="bDate" type="date" min="${iso(min)}" max="${iso(max)}" value="${bk.date}"></div>
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
    const s = e.target.closest('[data-store-pick]'); if (s) { keep(); bk.store = s.dataset.storePick; bk.time = ''; renderBook(); return; }
    const sl = e.target.closest('[data-slot]'); if (sl) { keep(); bk.time = sl.dataset.slot; renderBook(); }
  });
  sheet.addEventListener('change', (e) => { if (e.target.id === 'bDate') { keep(); bk.date = e.target.value; bk.time = ''; renderBook(); } });
  sheet.addEventListener('submit', (e) => {
    e.preventDefault(); keep();
    const bad = !bk.date ? 'date' : !bk.time ? 'time' : !bk.name.trim() ? 'name' : !bk.phone.trim() ? 'phone' : '';
    if (bad) { renderBook(bad); $('.f.bad input, .f.bad button', sheet)?.focus(); return; }
    const date = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(bk.date + 'T12:00'));
    $('#bookForm', sheet).outerHTML = `<div class="done"><span class="eyebrow">${t('book.title')}</span><h2>${esc(t('book.okTitle', { name: bk.name.trim().split(/\s+/)[0] }))}</h2><p class="sub">${esc(t('book.okText', { store: city(bk.store), date, time: bk.time }))}</p><p class="note">${t('book.demo')}</p><div><button class="btn" data-close>${t('book.close')}</button></div></div>`;
  });

  /* ---------- chrome ---------- */
  function chrome() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $('#lang').innerHTML = S.languages.map((l) => `<button data-lang="${l.code}" lang="${l.code}" title="${l.name}" aria-pressed="${l.code === lang}">${l.label}</button>`).join('');
    if (!$('.nav-book')) $('#nav').insertAdjacentHTML('beforeend', '<button class="nav-book" data-book></button>');
    $('.nav-book').textContent = t('nav.book');
    menuBtn.setAttribute('aria-label', t('nav.menu'));
    const allBrands = [...CAT.brands].sort((a, b) => a.name.localeCompare(b.name));
    $('#footer').innerHTML = `<div class="wrap">
      <div class="f-brands">
        <h4>${t('houses.eyebrow')}</h4>
        <ul>${allBrands.map((b) => `<li>${b.featured
          ? `<a href="#/brand/${b.id}">${esc(b.name)}</a>`
          : b.website ? `<a href="${b.website}" target="_blank" rel="noopener">${esc(b.name)} <span aria-hidden="true">↗</span></a>` : `<span>${esc(b.name)}</span>`}
          <small>${esc(country(b.origin))}</small></li>`).join('')}</ul>
      </div>
      <div class="f-grid">
        <div><img src="img/logos/taf-white.svg" alt="Takis Angelides Furnihome"><p>${t('footer.tag')}</p></div>
        <div><h4>${t('nav.showrooms')}</h4><ul>${S.stores.map((s) => `<li><a href="#/showrooms">${city(s.id)}</a> · <a href="${tel(s.phone)}">${s.phone.replace('+357 ', '')}</a></li>`).join('')}</ul></div>
        <div><h4>TAF</h4><ul><li><a href="#/inspiration">${t('nav.inspiration')}</a></li><li><a href="#/story">${t('nav.about')}</a></li><li><a href="mailto:${S.headOffice.email}">${S.headOffice.email}</a></li><li><a href="${tel(S.headOffice.phone)}">${S.headOffice.phone}</a></li></ul></div>
        <div><h4>Social</h4><ul><li><a href="${S.social.instagram}" target="_blank" rel="noopener">Instagram</a></li><li><a href="${S.social.facebook}" target="_blank" rel="noopener">Facebook</a></li></ul></div>
      </div>
      <div class="f-bottom"><span>© ${new Date().getFullYear()} Takis Angelides Furnihome Ltd. ${t('footer.rights')}</span><span>${S.stores.map((s) => city(s.id)).join(' · ')}</span></div>
    </div>`;
  }

  document.addEventListener('click', (e) => {
    const l = e.target.closest('[data-lang]');
    if (l) { lang = l.dataset.lang; store.set('taf.lang', lang); chrome(); route(true); return; }
    const b = e.target.closest('[data-book]');
    if (b) { e.preventDefault(); closeMenu(); openBook({ store: b.dataset.store || bk.store, interest: b.dataset.interest ?? bk.interest, pieceName: b.dataset.pieceName }); return; }
    const c = e.target.closest('[data-piece]');
    if (c) { const [bid, n] = c.dataset.piece.split('|'); openPiece(bid, n, c.dataset.list); return; }
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
        grid.classList.remove('out'); observe();
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
