/* CAREA — interactions + GSAP animations */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Photo slots: load img/*.jpg if present ---------- */
  $$('.photo[data-photo]').forEach((el) => {
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url("${el.dataset.photo}")`;
      el.classList.add('has-photo');
    };
    img.src = el.dataset.photo;
  });

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = $('.nav__burger');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    menu.hidden = !open;
  };
  burger.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Program buttons prefill the form ---------- */
  const select = $('#program');
  $$('[data-program]').forEach((btn) =>
    btn.addEventListener('click', () => { select.value = btn.dataset.program; })
  );

  /* ---------- Before / after slider ---------- */
  const ba = $('#ba');
  if (ba) {
    const range = $('.ba__range', ba);
    const set = (v) => ba.style.setProperty('--pos', `${v}%`);
    range.addEventListener('input', () => set(range.value));
    set(range.value);
  }

  /* ---------- Form → opens e-mail to rezervace@carea.cz ---------- */
  const form = $('#form');
  const status = $('#form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach((f) => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { status.textContent = 'Vyplňte prosím jméno, platný e-mail a zprávu.'; return; }

    const d = Object.fromEntries(new FormData(form));
    const subject = `Poptávka${d.program ? ' — ' + d.program : ''} (${d.jmeno})`;
    const body = [
      `Jméno: ${d.jmeno}`,
      `E-mail: ${d.email}`,
      d.telefon ? `Telefon: ${d.telefon}` : '',
      d.program ? `Program: ${d.program}` : '',
      '',
      d.zprava,
    ].filter((l, i) => l !== '' || i === 4).join('\n');
    window.location.href = `mailto:rezervace@carea.cz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Otevíráme váš e-mailový program s připravenou zprávou…';
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- GSAP ---------- */
  if (!window.gsap || reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero intro
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero__eyebrow', { opacity: 0, x: -24, duration: 1 })
    .from('.hero__word', { yPercent: 110, duration: 1.3, stagger: 0.12 }, '<0.1')
    .from('.hero__bottom', { opacity: 0, y: 30, duration: 1 }, '-=0.8')
    .from('.fact', { opacity: 0, y: 20, duration: 0.9, stagger: 0.08 }, '-=0.7')
    .from('.hero__photo', { scale: 1.12, duration: 2.4, ease: 'power2.out' }, 0);

  // Hero parallax
  gsap.to('.hero__photo', {
    yPercent: 14, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Section headings
  $$('.section-head, .ba__text').forEach((el) => {
    gsap.from(el.children, {
      opacity: 0, y: 34, duration: 1, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // Gold eyebrow lines draw in
  $$('.eyebrow__line').forEach((line) => {
    gsap.from(line, {
      scaleX: 0, transformOrigin: 'left', duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: line, start: 'top 92%' },
    });
  });

  // Cards / blocks reveal in batches
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    onEnter: (batch) => gsap.from(batch, { opacity: 0, y: 48, duration: 1, stagger: 0.09, ease: 'power3.out', overwrite: true }),
    once: true,
  });

  // Counters
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
      onUpdate: () => { el.textContent = obj.v.toFixed(dec).replace('.', ','); },
    });
  });

  // Process timeline line
  gsap.from('.steps__line span', {
    scaleX: 0, ease: 'none',
    scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 60%', scrub: true },
  });

  // Wax photo parallax
  gsap.to('[data-parallax]', {
    yPercent: -10, ease: 'none',
    scrollTrigger: { trigger: '.wax', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // Fleet big number
  gsap.from('.fleet__big', {
    opacity: 0, x: 60, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.fleet', start: 'top 70%' },
  });

  // Before/after: sweep once on enter to show it's interactive
  if (ba) {
    const range = $('.ba__range', ba);
    const p = { v: 50 };
    gsap.timeline({ scrollTrigger: { trigger: ba, start: 'top 70%', once: true } })
      .to(p, { v: 22, duration: 0.9, ease: 'power2.inOut', onUpdate: () => { range.value = p.v; ba.style.setProperty('--pos', `${p.v}%`); } })
      .to(p, { v: 50, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { range.value = p.v; ba.style.setProperty('--pos', `${p.v}%`); } });
  }
})();
