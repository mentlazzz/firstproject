/* CAREA — hero: menu, GSAP intro, scroll-driven wash animation */
(() => {
  const $ = (s) => document.querySelector(s);

  const burger = $('.nav__burger');
  const menu = $('#mmenu');
  burger.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
  });

  /* ---------- Wash sequence (frames/ from the video) ---------- */
  const FRAMES = window.CAREA_FRAMES ? window.CAREA_FRAMES.length : 193;
  const canvas = $('#wash');
  const ctx = canvas.getContext('2d');
  const small = matchMedia('(max-width: 900px)').matches;
  const src = (i) => window.CAREA_FRAMES ? window.CAREA_FRAMES[i] : `frames/${small ? 'sm' : 'lg'}/${String(i + 1).padStart(3, '0')}.webp`;
  const imgs = new Array(FRAMES);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = reduce ? FRAMES - 1 : 0;

  const nearestLoaded = (i) => {
    for (let d = 0; d < FRAMES; d++) {
      if (imgs[i - d]?.complete && imgs[i - d].naturalWidth) return imgs[i - d];
      if (imgs[i + d]?.complete && imgs[i + d].naturalWidth) return imgs[i + d];
    }
    return null;
  };

  const draw = () => {
    const img = nearestLoaded(current);
    if (!img) return;
    const W = canvas.width, H = canvas.height;
    const ratio = img.naturalWidth / img.naturalHeight;
    let fw, fh, x, y;
    if (W / H < 1) { // portrait (mobile): fill the media box
      fw = W * 1.12; fh = fw / ratio; x = (W - fw) / 2; y = H - fh;
    } else {         // desktop: car sits low, under the headline
      fw = W * .8; fh = fw / ratio;
      if (fh > H * .72) { fh = H * .72; fw = fh * ratio; }
      x = (W - fw) / 2 + W * .05; y = H - fh * .88;
    }
    ctx.fillStyle = '#060606';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, x, y, fw, fh);
    // blend the frame edges into the background
    const fade = (x0, y0, x1, y1, rx, ry, rw, rh) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(6,6,6,1)'); g.addColorStop(1, 'rgba(6,6,6,0)');
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    };
    const ex = fw * .14, ey = fh * .3;
    fade(x, 0, x + ex, 0, x - 1, 0, ex + 1, H);
    fade(x + fw, 0, x + fw - ex, 0, x + fw - ex, 0, ex + 1, H);
    fade(0, y, 0, y + ey, 0, y - 1, W, ey + 1);
  };

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    draw();
  };

  // first frame (or last for reduced motion) right away, then the rest in order
  const load = (i) => new Promise((res) => {
    const im = new Image();
    im.onload = im.onerror = () => { if (i === current) draw(); res(); };
    im.src = src(i);
    imgs[i] = im;
  });
  load(current).then(async () => {
    resize();
    if (reduce) return;
    for (let i = 0; i < FRAMES; i += 8) await Promise.all(Array.from({ length: 8 }, (_, k) => i + k < FRAMES && !imgs[i + k] ? load(i + k) : null));
  });
  addEventListener('resize', resize);

  /* ---------- Nav background after the hero ---------- */
  const nav = $('.nav');
  const heroEl = $('.hero');
  const navState = () => nav.classList.toggle('is-solid', heroEl.getBoundingClientRect().bottom < 80 || scrollY > innerHeight * 2.6);
  addEventListener('scroll', navState, { passive: true });
  navState();

  /* ---------- Program buttons prefill the form ---------- */
  const select = $('#program');
  document.querySelectorAll('[data-program]').forEach((b) => b.addEventListener('click', () => { select.value = b.dataset.program; }));

  /* ---------- Form → e-mail to rezervace@carea.cz ---------- */
  const form = $('#form');
  const status = $('#form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach((f) => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { status.textContent = 'Vyplňte prosím jméno, platný e-mail a zprávu.'; return; }
    const d = Object.fromEntries(new FormData(form));
    const body = [`Jméno: ${d.jmeno}`, `E-mail: ${d.email}`, d.telefon && `Telefon: ${d.telefon}`, d.program && `Program: ${d.program}`, '', d.zprava]
      .filter((l) => l !== undefined && l !== false && l !== null).join('\n');
    const subject = `Poptávka${d.program ? ' — ' + d.program : ''} (${d.jmeno})`;
    location.href = `mailto:rezervace@carea.cz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Otevíráme váš e-mail s připravenou zprávou…';
  });
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Reviews: card fan carousel (vanilla port of card-fan-carousel) ---------- */
  const initFan = (animate) => {
    const stage = $('#fan-stage');
    if (!stage || !window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);
    const T = (d) => (animate ? d : 0);
    const esc = (t) => t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const GOOGLE = 'https://www.google.com/maps/search/?api=1&query=CAREA+U+D%C3%BDh%C3%A1rny+1162+Kralupy+nad+Vltavou';

    // Cards: real reviews + Google score + "write a review"
    const reviews = window.CAREA_REVIEWS || [];
    const html = [];
    html.push(`<div class="fan-card fan-card--score"><span class="fan-card__g">Google</span><span class="fan-card__big">5,0</span><span class="fan-card__stars">★★★★★</span><p>Reálné zkušenosti zákazníků po otevření naší provozovny v Kralupech nad Vltavou.</p></div>`);
    reviews.forEach((r) => {
      const short = r.text.length < 220;
      html.push(`<figure class="fan-card" style="margin:0"><div class="fan-card__top"><span class="fan-card__stars">${'★'.repeat(r.stars || 5)}</span><span class="fan-card__g">Google</span></div>
        <span class="fan-card__mark" aria-hidden="true">“</span>
        <blockquote class="fan-card__text${short ? ' fan-card__text--short' : ''}" style="margin:0">${esc(r.text)}</blockquote>
        <figcaption class="fan-card__who"><span class="fan-card__av">${esc(r.name[0])}</span><span><b>${esc(r.name)}</b><small>${esc(r.date)} · ověřená recenze</small></span></figcaption></figure>`);
    });
    html.push(`<a class="fan-card fan-card--cta" href="${GOOGLE}" target="_blank" rel="noopener"><span class="fan-card__g">Byli jste u nás?</span><h3>Napište nám <em>recenzi</em></h3><span class="link">Google recenze</span></a>`);
    // keep the longest review in the middle when there are few cards
    if (html.length === 4) html.splice(1, 2, html[2], html[1]);
    stage.innerHTML = html.join('');

    const cards = [...stage.querySelectorAll('.fan-card')];
    const total = cards.length;
    const MAX = 7, HALF = 3;
    const paged = total > MAX;
    const FAN = [
      { rot: -21, scale: .7756, x: -30, y: 7.3, z: 1 }, { rot: -14, scale: .8498, x: -22, y: 4, z: 2 },
      { rot: -7, scale: .9346, x: -11, y: 1.3, z: 3 }, { rot: 0, scale: 1, x: 0, y: 0, z: 10 },
      { rot: 7, scale: .9346, x: 11, y: 1.3, z: 3 }, { rot: 14, scale: .8498, x: 22, y: 4, z: 2 },
      { rot: 21, scale: .7756, x: 30, y: 7.3, z: 1 },
    ];
    const wMult = () => { const w = innerWidth; return w < 480 ? .28 : w < 640 ? .38 : w < 768 ? .5 : w < 1024 ? .75 : 1; };
    const slotCount = paged ? MAX : total;
    const cfg = (slot) => {
      if (slotCount >= MAX) return FAN[slot];
      const c = slotCount >> 1, d = slotCount > 1 ? (slot - c) / c : 0, a = Math.abs(d);
      // few cards: spread them a bit wider than the 7-card fan
      return { rot: d * 12, scale: 1 - .16 * a * a, x: d * 21, y: a * a * 3.4, z: 10 - Math.abs(slot - c) };
    };

    let center = paged ? HALF : total >> 1;
    let busy = false, dir = null, prevVisible = new Set(), entered = false, hoverSlot = null, leaveT = null;

    const visibleMap = () => {
      const m = new Map();
      if (!paged) { cards.forEach((_, i) => m.set(i, i)); return m; }
      for (let s = 0; s < MAX; s++) m.set(((center + s - HALF) % total + total) % total, s);
      return m;
    };

    const dots = $('#fan-dots');
    if (paged) {
      $('#fan-nav').hidden = false;
      dots.innerHTML = cards.map(() => '<span></span>').join('');
    }
    const syncDots = () => dots.querySelectorAll('span').forEach((d, i) => d.classList.toggle('is-on', i === center));

    const layout = (hovered = null, quick = false) => {
      const m = wMult(), map = visibleMap();
      const mid = (map.size) >> 1;
      cards.forEach((el, i) => {
        const slot = map.get(i);
        if (slot === undefined) return;
        const b = cfg(slot);
        let x = b.x * m, y = b.y, rot = b.rot, sc = b.scale, delay = 0;
        if (hovered !== null) {
          const dist = Math.abs(slot - hovered);
          delay = dist * .02;
          if (slot === hovered) { y -= 2.5; sc *= 1.08; }
          else {
            const n = mid > 0 ? (slot - mid) / mid : 0;
            const push = 8 * (1 - Math.abs(n)) * (1 + .2 * Math.max(0, 3 - dist));
            if (slot < hovered) { x -= push * m; rot -= 3 / (dist + 1); } else { x += push * m; rot += 3 / (dist + 1); }
          }
        } else delay = Math.abs(slot - mid) * .02;
        el.classList.toggle('is-center', slot === mid);
        gsap.to(el, { x: `${x}rem`, y: `${y}rem`, rotation: rot, scale: sc, duration: T(quick ? .5 : .5), delay: T(delay), ease: 'elastic.out(1,.75)', overwrite: 'auto' });
        gsap.set(el, { zIndex: b.z });
      });
    };

    const render = () => {
      const map = visibleMap(), m = wMult(), first = !entered;
      let done = 0;
      const fin = () => { if (++done >= map.size) { busy = false; entered = true; } };
      busy = true;
      cards.forEach((el, i) => {
        const slot = map.get(i), was = prevVisible.has(i);
        if (slot !== undefined) {
          const b = cfg(slot);
          const target = { x: `${b.x * m}rem`, y: `${b.y}rem`, rotation: b.rot, scale: b.scale, opacity: 1, zIndex: b.z };
          if (first) {
            gsap.set(el, { x: 0, y: '12rem', rotation: 0, scale: .5, opacity: 0 });
            gsap.to(el, { ...target, duration: T(1.2), ease: 'elastic.out(1.05,.78)', delay: T(.2 + slot * .06), onComplete: fin });
          } else if (!was) {
            gsap.set(el, { x: `${dir === 'right' ? 40 : -40}rem`, y: `${b.y}rem`, rotation: dir === 'right' ? 30 : -30, scale: .5, opacity: 0 });
            gsap.to(el, { ...target, duration: T(.6), ease: 'power2.out', onComplete: fin });
          } else gsap.to(el, { ...target, duration: T(.5), ease: 'power2.out', onComplete: fin });
          el.classList.toggle('is-center', slot === (map.size >> 1));
          el.dataset.slot = slot;
          el.removeAttribute('aria-hidden'); el.inert = false;
        } else {
          if (was) gsap.to(el, { x: `${dir === 'right' ? -40 : 40}rem`, opacity: 0, scale: .5, rotation: dir === 'right' ? -30 : 30, duration: T(.4), ease: 'power2.in', zIndex: 0 });
          else if (first) gsap.set(el, { opacity: 0, scale: .3, x: 0, y: 0, zIndex: 0 });
          delete el.dataset.slot;
          el.setAttribute('aria-hidden', 'true'); el.inert = true;
        }
      });
      prevVisible = new Set(map.keys());
      if (paged) syncDots();
    };

    const cycle = (d) => {
      if (busy || !paged) return;
      dir = d;
      center = d === 'right' ? (center + 1) % total : (center - 1 + total) % total;
      render();
    };
    document.querySelectorAll('.fan__arrow').forEach((b) => b.addEventListener('click', () => cycle(b.dataset.dir)));
    $('#fan').addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') cycle('right'); if (e.key === 'ArrowLeft') cycle('left'); });

    // hover: lift the card, push the neighbours aside
    cards.forEach((el) => el.addEventListener('mouseenter', () => {
      if (busy || el.dataset.slot === undefined) return;
      clearTimeout(leaveT);
      const s = +el.dataset.slot;
      if (hoverSlot !== s) { hoverSlot = s; layout(s); }
    }));
    stage.addEventListener('mouseleave', () => { if (busy) return; clearTimeout(leaveT); leaveT = setTimeout(() => { hoverSlot = null; layout(null); }, 50); });
    addEventListener('resize', () => { if (!busy && entered) layout(hoverSlot); });

    // swipe on touch screens
    let sx = null;
    stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) cycle(dx < 0 ? 'right' : 'left'); sx = null; });

    // deal the cards when the section scrolls into view
    if (animate) ScrollTrigger.create({ trigger: stage, start: 'top 75%', once: true, onEnter: render });
    else render();
  };
  initFan(!reduce);

  if (!window.gsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Intro ---------- */
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__canvas', { opacity: 0, scale: 1.06, duration: 2.6, ease: 'power3.out' })
    .from('.nav > *', { opacity: 0, y: -12, duration: 1.2, stagger: .06 }, .3)
    .from('.hero__rule', { scaleX: 0, duration: 1.2 }, .5)
    .from('.hero__eyebrow', { opacity: 0, x: -10, duration: 1.2 }, .6)
    .from('.line__in', { yPercent: 110, duration: 1.6, stagger: .14 }, .6)
    .from('.hero__cols p', { opacity: 0, y: 16, duration: 1.2, stagger: .1 }, 1.2)
    .from('.hero__actions > *', { opacity: 0, y: 12, duration: 1.1, stagger: .1 }, 1.4)
    .from('.hero__marks li', { opacity: 0, y: 14, duration: 1.2, stagger: .08 }, 1.5)
    .from('.hero__hint', { opacity: 0, duration: 1.2 }, 2);

  /* ---------- Scroll: pin the hero and play the wash ---------- */
  const hero = $('.hero');
  const frame = { i: 0 };
  gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: () => (hero.offsetHeight > innerHeight + 2 ? 'bottom bottom' : 'top top'),
      end: () => '+=' + Math.round(innerHeight * 2.4),
      pin: true,
      scrub: .6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })
    .to(frame, { i: FRAMES - 1, ease: 'none', duration: 1, snap: 'i', onUpdate: () => { current = frame.i; draw(); } }, 0)
    .to('.hero__hint', { opacity: 0, duration: .06 }, 0);


  /* ---------- Sections ---------- */
  const once = (trigger, start = 'top 85%') => ({ trigger, start, once: true });

  gsap.utils.toArray('.sec__head, .split__body, .fleet__body, .contact__info, .statement__in').forEach((el) => {
    gsap.from(el.children, { opacity: 0, y: 40, duration: 1.3, stagger: .1, ease: 'expo.out', scrollTrigger: once(el) });
  });
  gsap.utils.toArray('.kicker__no').forEach((el) => gsap.from(el, { opacity: 0, x: -12, duration: 1, scrollTrigger: once(el, 'top 90%') }));

  ScrollTrigger.batch('.reveal', {
    start: 'top 88%', once: true,
    onEnter: (b) => gsap.from(b, { opacity: 0, y: 40, duration: 1.2, stagger: .12, ease: 'expo.out' }),
  });

  // Images open like a curtain, then drift slowly
  gsap.utils.toArray('.reveal-img, .detailing__img').forEach((fig) => {
    const img = fig.querySelector('img');
    gsap.timeline({ scrollTrigger: once(fig, 'top 80%') })
      .from(fig, { clipPath: 'inset(0 0 100% 0)', duration: 1.6, ease: 'expo.inOut' })
      .from(img, { scale: 1.25, duration: 2, ease: 'expo.out' }, '<.2');
    gsap.to(img, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Prices count up
  gsap.utils.toArray('[data-price]').forEach((el) => {
    const end = +el.dataset.price, o = { v: end * .6 };
    gsap.to(o, { v: end, duration: 1.6, ease: 'expo.out', scrollTrigger: once(el, 'top 92%'),
      onUpdate: () => { el.textContent = Math.round(o.v / 10) * 10 >= end ? end.toLocaleString('cs-CZ') : (Math.round(o.v / 10) * 10).toLocaleString('cs-CZ'); } });
  });

  // Statement: slow parallax + headline lines
  gsap.to('.statement__bg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.st-line', { yPercent: 60, opacity: 0, duration: 1.6, stagger: .15, ease: 'expo.out', scrollTrigger: once('.statement', 'top 60%') });

  // Fleet: big 20 %
  const c = { v: 0 }, cEl = document.querySelector('[data-count]');
  gsap.timeline({ scrollTrigger: once('.fleet', 'top 70%') })
    .from('.fleet__num', { opacity: 0, x: -60, duration: 1.6, ease: 'expo.out' })
    .to(c, { v: 20, duration: 1.8, ease: 'expo.out', onUpdate: () => { cEl.textContent = Math.round(c.v); } }, '<');

  gsap.from('.footer__big', { opacity: 0, y: 60, letterSpacing: '.5em', duration: 1.8, ease: 'expo.out', scrollTrigger: once('.footer', 'top 90%') });
})();
