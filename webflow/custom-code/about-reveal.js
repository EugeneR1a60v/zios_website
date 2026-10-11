// About us: GSAP reveal animations for the hero (Figma 10091:14358) and the
// intro section (Figma 10091:14430).
//  - Hero (on load): background settles from a slight zoom, eyebrow fades up,
//    the heading rises word by word out of a mask (stagger).
//  - Hero stats (when scrolled into view): stats fade up with a stagger, the
//    divider draws from left to right, numbers count up to their value
//    (650+, 99.9%, 15,000+, 500K+; 24/7 is left as is).
//  - Intro (when scrolled into view): eyebrow, title words and text stagger in,
//    the photo uncovers from the bottom while it settles from a slight zoom.
//  - Timeline (Figma 10091:14431): the bright centre line fills down the track
//    with scroll (scrubbed); each milestone's year box opens from the centre
//    line outwards, the year rises inside it, then the text fades up.
//  - Approach and Mission (Figma 10106:15514): title words rise, subtitle fades;
//    per row the cards rise in turn, icons pop, copy follows, ASCII art scans in.
//  - CTA (Figma 10105:14455): title words rise line by line, text and button
//    follow; the photo settles from a zoom and the ASCII layer drifts with scroll.
// Elements are marked with data-ab-* attributes in Webflow. They start hidden
// via the page head CSS (only while <html> has .ab-js); this script reveals
// them, and if it can't run (no GSAP, reduced motion) it simply shows them.
// Lives in the About us page footer custom code; loads GSAP/ScrollTrigger from
// jsDelivr only if the page doesn't already have them.
(function () {
  var root = document.documentElement;
  window.__abReveal = true;

  function showAll() { root.classList.remove('ab-js'); }

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

  // Wrap each word in a mask so it can rise into view; <br> line breaks are kept.
  // The heading keeps its text for assistive tech through aria-label.
  function splitWords(el) {
    var lines = [[]];
    el.childNodes.forEach(function (node) {
      if (node.nodeName === 'BR') lines.push([]);
      else lines[lines.length - 1].push(node.textContent);
    });
    lines = lines.map(function (l) { return l.join('').replace(/\s+/g, ' ').trim(); });
    el.setAttribute('aria-label', lines.join(' '));
    el.textContent = '';
    lines.forEach(function (line, li) {
      if (li) el.appendChild(document.createElement('br'));
      line.split(' ').forEach(function (word, i) {
        if (!word) return;
        if (i) el.appendChild(document.createTextNode(' '));
        var mask = document.createElement('span');
        mask.className = 'ab-w';
        mask.setAttribute('aria-hidden', 'true');
        var inner = document.createElement('span');
        inner.className = 'ab-wi';
        inner.textContent = word;
        mask.appendChild(inner);
        el.appendChild(mask);
      });
    });
    return el.querySelectorAll('.ab-wi');
  }

  // "15,000+" -> { value: 15000, decimals: 0, comma: true, prefix: '', suffix: '+' }
  function parseCount(text) {
    var m = text.trim().match(/^([^\d]*)([\d][\d,]*(?:\.\d+)?)(.*)$/);
    if (!m) return null;
    var num = m[2];
    var dot = num.indexOf('.');
    return {
      prefix: m[1],
      value: parseFloat(num.replace(/,/g, '')),
      decimals: dot === -1 ? 0 : num.length - dot - 1,
      comma: num.indexOf(',') !== -1,
      suffix: m[3]
    };
  }

  function formatCount(c, v) {
    var s = c.comma
      ? v.toLocaleString('en-US', { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals })
      : v.toFixed(c.decimals);
    return c.prefix + s + c.suffix;
  }

  function countUp(el, delay) {
    var c = parseCount(el.textContent);
    if (!c) return;
    var o = { v: 0 };
    el.textContent = formatCount(c, 0);
    gsap.to(o, {
      v: c.value,
      duration: 1.8,
      delay: delay,
      ease: 'power3.out',
      onUpdate: function () { el.textContent = formatCount(c, o.v); },
      onComplete: function () { el.textContent = formatCount(c, c.value); }
    });
  }

  function initHero(sec) {
    var bg = sec.querySelector('.abouthero_bg');
    var eyebrow = sec.querySelectorAll('[data-ab-reveal]');
    var heading = sec.querySelector('[data-ab-split]');
    var words = heading ? splitWords(heading) : [];
    var stats = sec.querySelectorAll('[data-ab-stat]');
    var line = sec.querySelector('[data-ab-line]');
    var counts = sec.querySelectorAll('[data-ab-count]');

    gsap.set([eyebrow, heading, stats, line], { autoAlpha: 1 });

    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (bg) tl.fromTo(bg, { scale: 1.08 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0);
    tl.from(eyebrow, { y: 24, autoAlpha: 0, duration: 0.9 }, 0.15)
      .from(words, { yPercent: 110, duration: 1.1, stagger: 0.06 }, 0.25);

    var statsTl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: sec.querySelector('.abouthero_stats'), start: 'top 90%', once: true }
    });
    statsTl.from(stats, { y: 40, autoAlpha: 0, duration: 1, stagger: 0.12 }, 0);
    if (line) statsTl.from(line, { scaleX: 0, transformOrigin: '0% 50%', duration: 1.4, ease: 'power3.inOut' }, 0.2);
    statsTl.add(function () {
      counts.forEach(function (el, i) { countUp(el, i * 0.12); });
    }, 0);
  }

  function initIntro(sec) {
    var eyebrow = sec.querySelector('.aboutintro_eyebrow');
    var title = sec.querySelector('[data-ab-split]');
    var words = title ? splitWords(title) : [];
    var text = sec.querySelector('.aboutintro_text');
    var visual = sec.querySelector('[data-ab-visual]');
    var img = visual && visual.querySelector('img');

    gsap.set([eyebrow, title, text, visual], { autoAlpha: 1 });

    var tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      scrollTrigger: { trigger: sec, start: 'top 75%', once: true }
    });
    if (visual) {
      tl.fromTo(visual, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' }, 0);
      if (img) tl.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0);
    }
    tl.from(eyebrow, { y: 24, autoAlpha: 0, duration: 0.9 }, 0.1)
      .from(words, { yPercent: 110, duration: 1, stagger: 0.05 }, 0.25)
      .from(text, { y: 30, autoAlpha: 0, duration: 1 }, 0.55);
  }

  function initTimeline(sec) {
    var list = sec.querySelector('.abouttl_list');
    var progress = sec.querySelector('[data-ab-tl-progress]');
    var items = sec.querySelectorAll('[data-ab-tl-item]');
    var mobile = window.matchMedia('(max-width: 767px)');

    // The bright line fills down the track as the list scrolls past the middle of the screen.
    if (progress && list) {
      gsap.fromTo(progress, { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: list, start: 'top 60%', end: 'bottom 60%', scrub: 0.6 }
      });
    }

    items.forEach(function (item) {
      var box = item.querySelector('.abouttl_box');
      var year = item.querySelector('.abouttl_year');
      var text = item.querySelector('.abouttl_text');
      // Boxes open from the centre line outwards (on mobile the line is on the left, so all open to the right).
      var fromLeft = mobile.matches || item.classList.contains('is-right');
      var closed = fromLeft ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)';

      gsap.set(item, { autoAlpha: 1 });
      var tl = gsap.timeline({
        defaults: { ease: 'power4.out' },
        scrollTrigger: { trigger: item, start: 'top 80%', once: true }
      });
      if (box) tl.fromTo(box, { clipPath: closed }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut' }, 0);
      if (year) tl.from(year, { yPercent: 110, duration: 1 }, 0.45);
      if (text) tl.from(text, { y: 24, autoAlpha: 0, duration: 0.9 }, 0.6);
    });
  }

  function initApproach(sec) {
    var title = sec.querySelector('[data-ab-split]');
    var words = title ? splitWords(title) : [];
    var sub = sec.querySelector('.aboutappr_sub');

    gsap.set([title, sub], { autoAlpha: 1 });
    gsap.timeline({
      defaults: { ease: 'power4.out' },
      scrollTrigger: { trigger: sec, start: 'top 75%', once: true }
    })
      .from(words, { yPercent: 110, duration: 1, stagger: 0.05 }, 0)
      .from(sub, { y: 24, autoAlpha: 0, duration: 0.9 }, 0.3);

    // Each row: its cards rise in turn; inside each card the icon pops, the copy
    // follows line by line and the ASCII art scans in from the bottom in steps.
    sec.querySelectorAll('[data-ab-appr-row]').forEach(function (row) {
      var cards = row.querySelectorAll('[data-ab-appr-card]');
      gsap.set(cards, { autoAlpha: 1 });
      var tl = gsap.timeline({
        defaults: { ease: 'power4.out' },
        scrollTrigger: { trigger: row, start: 'top 80%', once: true }
      });
      cards.forEach(function (card, i) {
        var at = i * 0.15;
        var icon = card.querySelector('.aboutappr_icon');
        var copy = card.querySelectorAll('.aboutappr_card_title, .aboutappr_card_text');
        var ascii = card.querySelector('[data-ab-appr-ascii]');
        tl.from(card, { y: 60, autoAlpha: 0, duration: 1.1 }, at);
        if (icon) tl.from(icon, { scale: 0.4, rotate: -20, autoAlpha: 0, duration: 0.8, ease: 'back.out(2)' }, at + 0.3);
        if (copy.length) tl.from(copy, { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, at + 0.25);
        if (ascii) tl.fromTo(ascii, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'steps(14)' }, at + 0.35);
      });
    });
  }

  function initCta(sec) {
    var title = sec.querySelector('[data-ab-split]');
    var words = title ? splitWords(title) : [];
    var rest = sec.querySelectorAll('[data-ab-reveal]');
    var photo = sec.querySelector('[data-ab-cta-photo]');
    var ascii = sec.querySelector('[data-ab-cta-ascii]');

    gsap.set([title, rest], { autoAlpha: 1 });
    var tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      scrollTrigger: { trigger: sec, start: 'top 70%', once: true }
    });
    tl.from(words, { yPercent: 110, duration: 1.1, stagger: 0.07 }, 0)
      .from(rest, { y: 30, autoAlpha: 0, duration: 1, stagger: 0.15 }, 0.35);
    if (photo) tl.fromTo(photo, { scale: 1.15 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0);

    // The ASCII layer is wider than the section; let it drift sideways as the section scrolls by.
    if (ascii) {
      gsap.fromTo(ascii, { xPercent: 0 }, {
        xPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    }
  }

  function init() {
    var hero = document.querySelector('.abouthero_sec');
    var intro = document.querySelector('.aboutintro_sec');
    var timeline = document.querySelector('.abouttl_sec');
    var approach = document.querySelector('.aboutappr_sec');
    var cta = document.querySelector('.aboutcta_sec');
    if (!hero && !intro && !timeline && !approach && !cta) return showAll();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return showAll();
    gsap.registerPlugin(ScrollTrigger);
    if (hero) initHero(hero);
    if (intro) initIntro(intro);
    if (timeline) initTimeline(timeline);
    if (approach) initApproach(approach);
    if (cta) initCta(cta);
    root.classList.remove('ab-js');
    ScrollTrigger.refresh();
  }

  function start() {
    ensureGsap()
      .then(function () { return document.fonts ? document.fonts.ready : null; })
      .then(init)
      .catch(showAll);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
