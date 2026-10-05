/* CAREA — hero interactions + GSAP intro */
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

  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo('.hero__img', { scale: 1.14, opacity: 0 }, { scale: 1.04, opacity: 1, duration: 2.8, ease: 'power3.out' })
    .from('.nav > *', { opacity: 0, y: -12, duration: 1.2, stagger: .06 }, .3)
    .from('.hero__rule', { scaleX: 0, duration: 1.2 }, .5)
    .from('.hero__eyebrow', { opacity: 0, x: -10, duration: 1.2 }, .6)
    .from('.line__in', { yPercent: 110, duration: 1.6, stagger: .14 }, .6)
    .from('.hero__cols p', { opacity: 0, y: 16, duration: 1.2, stagger: .1 }, 1.2)
    .from('.hero__actions > *', { opacity: 0, y: 12, duration: 1.1, stagger: .1 }, 1.4)
    .from('.hero__marks li', { opacity: 0, y: 14, duration: 1.2, stagger: .08 }, 1.5)
    .to('.hero__sheen', { xPercent: 200, duration: 2.2, ease: 'power2.inOut' }, 1.6);

  // Subtle depth: photo follows the pointer a little
  const img = $('.hero__img');
  if (matchMedia('(pointer: fine)').matches) {
    const x = gsap.quickTo(img, 'x', { duration: 1.4, ease: 'power3.out' });
    const y = gsap.quickTo(img, 'y', { duration: 1.4, ease: 'power3.out' });
    addEventListener('pointermove', (e) => {
      x((e.clientX / innerWidth - .5) * -18);
      y((e.clientY / innerHeight - .5) * -10);
    });
  }
})();
