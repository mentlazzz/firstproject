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
})();
