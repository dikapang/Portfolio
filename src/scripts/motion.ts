/* Perilaku gerak (GSAP) — parameter dan ritme milik portfolio ini.
   Pola aman: gsap.from() → konten tetap terlihat walau JS mati. */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  const E = 'power2.out';

  const intro = document.querySelector<HTMLElement>('[data-hero]');
  if (intro) {
    gsap.from(intro.children, { y: 18, autoAlpha: 0, duration: 0.75, stagger: 0.09, ease: E });
    /* Nama ikut stuck di lanskap: bergerak lebih lambat dari scroll dan
       memudar perlahan saat panel Profil tiba */
    gsap.to(intro, {
      yPercent: -34,
      autoAlpha: 0,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 42%', scrub: true },
    });
  }

  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 20, autoAlpha: 0, duration: 0.7, ease: E, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
    gsap.from(group.children, { y: 24, autoAlpha: 0, duration: 0.75, stagger: 0.09, ease: E, scrollTrigger: { trigger: group, start: 'top 86%', once: true } });
  });

  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
    const raw = el.dataset.count ?? '';
    const end = parseFloat(raw);
    const dec = (raw.split('.')[1] || '').length;
    const state = { v: 0 };
    el.textContent = (0).toFixed(dec);
    gsap.to(state, {
      v: end,
      duration: 1.6,
      ease: E,
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => { el.textContent = state.v.toFixed(dec); },
    });
  });

  /* Lanskap kini fixed — paralaksnya ditangani pointer di dalam scene */
}
