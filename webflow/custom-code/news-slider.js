// News / Section, every page: on tablet and phone (<=991px) add prev/next arrows and a progress
// bar under the news cards; the bar fills over 6s, then the slider advances (paused while
// touched or off screen, static with reduced motion). Same behaviour Home had via
// HomeMobileSliderKit + HomeMobileNews. Runs after the news Swiper init in the site footer.
(function () {
  if (!window.matchMedia('(max-width: 991px)').matches) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var de = /^de/i.test(document.documentElement.lang);
  var svg = '<svg viewBox="0 0 32 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 8h27M23 2l6 6-6 6"/></svg>';
  function btn(dir, label) {
    return '<button type="button" class="m-nav_btn is-' + dir + '" aria-label="' + label + '">' + svg + '</button>';
  }
  document.querySelectorAll('.news_slider_component .swiper').forEach(function (el) {
    var sw = el.swiper;
    if (!sw || el.parentNode.querySelector('.m-nav')) return;
    var nav = document.createElement('div');
    nav.className = 'm-nav';
    nav.innerHTML = btn('prev', de ? 'Zurück' : 'Previous') +
      '<div class="m-nav_bar"><div class="m-nav_fill"></div></div>' + btn('next', de ? 'Weiter' : 'Next');
    el.parentNode.appendChild(nav);
    var fill = nav.querySelector('.m-nav_fill');
    function next() { if (sw.isEnd) sw.slideTo(0); else sw.slideNext(); }
    nav.querySelector('.is-prev').addEventListener('click', function () { sw.slidePrev(); });
    nav.querySelector('.is-next').addEventListener('click', next);
    if (reduce) { fill.style.width = '100%'; return; }
    var t0 = performance.now(), held = false, seen = true;
    sw.on('slideChange', function () { t0 = performance.now(); });
    sw.on('touchStart', function () { held = true; });
    sw.on('touchEnd', function () { held = false; });
    new IntersectionObserver(function (e) { seen = e[0].isIntersecting; }).observe(el);
    (function tick(now) {
      if (held || !seen) t0 = now;
      var p = Math.min(1, (now - t0) / 6000);
      fill.style.width = p * 100 + '%';
      if (p >= 1) { t0 = now; next(); }
      requestAnimationFrame(tick);
    })(performance.now());
  });
})();
