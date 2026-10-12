// Scroll reveals (Our Team & Careers page).
// Same GSAP/ScrollTrigger setup as the Home hero (home-hero-parallax.js): loads
// GSAP from jsDelivr only if the page doesn't already have it.
// Markup hooks (set in the Designer):
//  - [data-reveal]          fades + slides up when it enters the viewport;
//                            siblings in one section stagger.
//  - [data-reveal-img]      image wrapper wipes open from the bottom while the
//                            image inside settles from a slight zoom.
//  - [data-reveal-line]     1px divider draws from left to right.
//  - [data-reveal-stagger]  list (CMS list or job rows): its items come in one
//                            after another.
//  - .teamhero_sec          hero: background settles from a zoom on load, text
//                            and CTA come in, background drifts on scroll.
// Elements start hidden only once the page head script has added
// html.team-reveal (see page-our-team-head.html), so without JS nothing hides.
// Reduced motion: everything stays visible, no animation.
(function () {
  // Job rows: '[ 01 ]', '[ 02 ]' ... (the CMS has no index field).
  function numberJobs() {
    Array.prototype.forEach.call(document.querySelectorAll('.jobs_row_num'), function (el, i) {
      el.textContent = '[ ' + String(i + 1).padStart(2, '0') + ' ]';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', numberJobs);
  else numberJobs();

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function showAll() { root.classList.remove('team-reveal'); }
  if (reduce) { showAll(); return; }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function ensureGsap() {
    var chain = Promise.resolve();
    if (typeof window.gsap === 'undefined') {
      chain = chain.then(function () { return loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'); });
    }
    return chain.then(function () {
      if (typeof window.ScrollTrigger === 'undefined') {
        return loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js');
      }
    });
  }
  function all(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    var EASE = 'power3.out';

    // Hero: plays on load, not on scroll.
    var hero = document.querySelector('.teamhero_sec');
    if (hero) {
      var bg = hero.querySelector('.teamhero_bg');
      var items = all('[data-reveal]', hero);
      var tl = gsap.timeline({ defaults: { ease: EASE } });
      if (bg) tl.fromTo(bg, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: 'power2.out' }, 0);
      gsap.set(items, { autoAlpha: 0, y: 40 });
      tl.to(items, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 0.2);
      if (bg) {
        gsap.to(bg, {
          yPercent: 9, ease: 'none', // bg is 110% tall, offset -10%, so 9% never shows a gap
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    }

    // Text blocks: stagger per section, each starts when it scrolls in.
    all('section').forEach(function (sec) {
      if (sec === hero) return;
      var els = all('[data-reveal]', sec);
      if (!els.length) return;
      gsap.set(els, { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.12, overwrite: true });
        }
      });
    });

    // Image wipes.
    all('[data-reveal-img]').forEach(function (wr) {
      var img = wr.querySelector('img');
      gsap.set(wr, { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' });
      if (img) gsap.set(img, { scale: 1.15 });
      var tl = gsap.timeline({ scrollTrigger: { trigger: wr, start: 'top 85%', once: true } });
      tl.to(wr, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut' }, 0);
      if (img) tl.to(img, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0);
    });

    // Divider lines.
    all('[data-reveal-line]').forEach(function (line) {
      gsap.set(line, { autoAlpha: 1, scaleX: 0, transformOrigin: '0% 50%' });
      gsap.to(line, {
        scaleX: 1, duration: 1.2, ease: 'power3.inOut',
        scrollTrigger: { trigger: line, start: 'top 90%', once: true }
      });
    });

    // Lists: items one after another (CMS items or job rows).
    all('[data-reveal-stagger]').forEach(function (list) {
      var items = all('[data-reveal-item]', list);
      if (!items.length) return;
      gsap.set(items, { autoAlpha: 0, y: 48 });
      ScrollTrigger.batch(items, {
        start: 'top 90%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.1, overwrite: true });
        }
      });
    });

    // GSAP has set every start state above, so the hiding CSS can go.
    showAll();
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  // If GSAP can't load, don't leave content hidden.
  var fallback = setTimeout(showAll, 4000);
  function start() {
    ensureGsap().then(function () { clearTimeout(fallback); init(); }).catch(function (e) {
      clearTimeout(fallback);
      showAll();
      console.warn('Team reveals skipped:', e);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
