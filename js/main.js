/* CAREA — interactions + GSAP animations */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Photo slots: use img/*.jpg once uploaded ---------- */
  const loadPhoto = (src, ok) => { const i = new Image(); i.onload = ok; i.src = src; };
  $$('.ph[data-photo]').forEach((el) => loadPhoto(el.dataset.photo, () => {
    el.style.backgroundImage = `url("${el.dataset.photo}")`;
    el.classList.add('has-photo');
  }));
  const heroPhoto = $('.hero__photo');
  if (heroPhoto) loadPhoto(heroPhoto.dataset.photo, () => {
    heroPhoto.style.backgroundImage = `url("${heroPhoto.dataset.photo}")`;
    heroPhoto.parentElement.classList.add('has-photo');
  });

  /* ---------- Header ---------- */
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = $('.burger');
  const mnav = $('#mnav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    mnav.hidden = !open;
  };
  burger.addEventListener('click', () => setMenu(mnav.hidden));
  $$('a', mnav).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Services rail arrows ---------- */
  const rail = $('#rail');
  $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
    const card = rail.firstElementChild.getBoundingClientRect().width;
    rail.scrollBy({ left: Number(b.dataset.scroll) * (card + 16) * 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  /* ---------- Tabs ---------- */
  const tabs = $$('[role="tab"]');
  const selectTab = (name, focus = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) selectTab(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true);
    });
  });
  $$('.svc[data-tab]').forEach((a) => a.addEventListener('click', () => selectTab(a.dataset.tab)));

  /* ---------- Program buttons prefill the form ---------- */
  const select = $('#program');
  $$('[data-program]').forEach((b) => b.addEventListener('click', () => { select.value = b.dataset.program; }));

  /* ---------- Before / after ---------- */
  const ba = $('#ba');
  const baRange = $('input', ba);
  const setBa = (v) => { ba.style.setProperty('--pos', `${v}%`); baRange.value = v; };
  baRange.addEventListener('input', () => setBa(baRange.value));

  /* ---------- Calendar + time slots (open Po–Ne 10:00–20:00) ---------- */
  const months = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
  const daysEl = $('#cal-days');
  const titleEl = $('#cal-title');
  const slotsEl = $('#slots');
  const pickedEl = $('#picked');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let pickedDate = null;
  let pickedTime = null;
  const sameDay = (a, b) => a && b && a.getTime() === b.getTime();
  const fmtDate = (d) => `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;

  const renderPicked = () => {
    pickedEl.textContent = pickedDate
      ? `Vybráno: ${fmtDate(pickedDate)}${pickedTime ? ' v ' + pickedTime : ' — vyberte čas'}`
      : 'Vyberte den a čas';
  };

  const renderSlots = () => {
    slotsEl.innerHTML = '';
    const now = new Date();
    for (let h = 10; h <= 18; h++) {
      const t = `${h}:00`;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = t;
      const past = pickedDate && sameDay(pickedDate, today) && h <= now.getHours();
      b.disabled = !pickedDate || past;
      b.setAttribute('aria-pressed', String(pickedTime === t));
      b.addEventListener('click', () => { pickedTime = t; renderSlots(); renderPicked(); });
      slotsEl.appendChild(b);
    }
  };

  const renderCal = () => {
    titleEl.textContent = `${months[view.getMonth()]} ${view.getFullYear()}`;
    daysEl.innerHTML = '';
    const offset = (view.getDay() + 6) % 7; // Monday first
    for (let i = 0; i < offset; i++) daysEl.appendChild(document.createElement('span'));
    const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= count; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = d;
      b.disabled = date < today;
      b.classList.toggle('is-today', sameDay(date, today));
      b.setAttribute('aria-pressed', String(sameDay(date, pickedDate)));
      b.setAttribute('aria-label', fmtDate(date));
      b.addEventListener('click', () => { pickedDate = date; pickedTime = null; renderCal(); renderSlots(); renderPicked(); });
      daysEl.appendChild(b);
    }
    $('[data-cal="-1"]').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
  };
  $$('[data-cal]').forEach((b) => b.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() + Number(b.dataset.cal), 1);
    renderCal();
  }));
  renderCal(); renderSlots(); renderPicked();

  /* ---------- Form → e-mail to rezervace@carea.cz ---------- */
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
    const lines = [
      `Jméno: ${d.jmeno}`,
      `E-mail: ${d.email}`,
      d.telefon && `Telefon: ${d.telefon}`,
      d.program && `Program: ${d.program}`,
      pickedDate && `Preferovaný termín: ${fmtDate(pickedDate)}${pickedTime ? ' v ' + pickedTime : ''}`,
      '',
      d.zprava,
    ].filter((l) => l !== undefined && l !== false && l !== null);
    const subject = `Poptávka${d.program ? ' — ' + d.program : ''} (${d.jmeno})`;
    window.location.href = `mailto:rezervace@carea.cz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    status.textContent = 'Otevíráme váš e-mail s připravenou zprávou…';
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- GSAP ---------- */
  if (!window.gsap || reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Car line-art: prepare stroke drawing
  const drawPaths = $$('.car .draw');
  drawPaths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  // Hero intro
  const split = new SplitText('.hero__line', { type: 'chars', charsClass: 'ch' });
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.kicker', { opacity: 0, y: 12, duration: .8 })
    .from(split.chars, { yPercent: 120, opacity: 0, rotate: 6, duration: 1.1, stagger: .025 }, '<.1')
    .from('.hero__brand', { opacity: 0, letterSpacing: '.5em', duration: 1.6, ease: 'power3.out' }, '-=.8')
    .from('.hero__tag, .hero__lead, .hero__btns', { opacity: 0, y: 18, duration: .9, stagger: .08 }, '-=1.1')
    .from('.car__body, .car__glass', { opacity: 0, duration: 1.2, ease: 'power2.out' }, .3)
    .to(drawPaths, { strokeDashoffset: 0, duration: 2.2, stagger: .08, ease: 'power2.inOut' }, .3)
    .from('.wheel', { opacity: 0, scale: .6, transformOrigin: 'center', duration: 1, stagger: .12 }, .9)
    .from('.wheel .rim', { rotate: -240, svgOrigin: '0 0', duration: 2, ease: 'power3.out' }, .9)
    .from('.car__shine', { opacity: 0, x: -120, duration: 1.4, ease: 'power2.out' }, 1.6)
    .from('.chip', { opacity: 0, y: 16, scale: .96, duration: .9, stagger: .15 }, 1.4)
    .from('.stats li', { opacity: 0, y: 20, duration: .8, stagger: .07 }, 1.2);

  // Gentle float on chips
  gsap.to('.chip--rating', { y: -8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.chip--pickup', { y: 8, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  // Car drifts slightly on scroll
  gsap.to('.car', { xPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Reveal on scroll
  const reveal = (targets, trigger, vars = {}) => gsap.from(targets, {
    opacity: 0, y: 36, duration: 1, stagger: .07, ease: 'power3.out',
    scrollTrigger: { trigger, start: 'top 86%', once: true }, ...vars,
  });
  reveal('.perk', '.perks', { y: 16 });
  reveal('.svc', '#rail');
  reveal('.plan', '.plans');
  reveal('.why__list li', '.why', { y: 16 });
  reveal('#dalsi .panel', '#dalsi');
  reveal('.case', '.cases');
  reveal('.flow li', '.flow', { y: 16, x: -10 });
  reveal('.booking > *', '.booking');
  reveal('.rv', '.reviews');
  reveal('.qa', '.faq', { y: 16 });
  reveal('.contact > *', '.contact');
  $$('.title').forEach((t) => {
    if (t.closest('.hero')) return;
    gsap.from(t, { opacity: 0, x: -24, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: t, start: 'top 90%', once: true } });
  });

  // Process line grows with scroll
  gsap.fromTo('.flow', { '--line': 0 }, { '--line': 1, ease: 'none', scrollTrigger: { trigger: '.flow', start: 'top 80%', end: 'bottom 55%', scrub: true } });

  // Before/after: one sweep so it reads as interactive
  const p = { v: 50 };
  gsap.timeline({ scrollTrigger: { trigger: ba, start: 'top 75%', once: true } })
    .to(p, { v: 20, duration: .9, ease: 'power2.inOut', onUpdate: () => setBa(p.v) })
    .to(p, { v: 50, duration: 1.1, ease: 'power2.inOut', onUpdate: () => setBa(p.v) });

  // Rating numbers
  $$('.why__num, .rv__big').forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: 5, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = o.v.toFixed(1).replace('.', ','); } });
  });
})();
