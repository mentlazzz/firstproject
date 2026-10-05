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

  gsap.from('.quote', { opacity: 0, y: 40, duration: 1.3, stagger: .15, ease: 'expo.out', scrollTrigger: once('.quotes') });
  gsap.from('.footer__big', { opacity: 0, y: 60, letterSpacing: '.5em', duration: 1.8, ease: 'expo.out', scrollTrigger: once('.footer', 'top 90%') });
})();
