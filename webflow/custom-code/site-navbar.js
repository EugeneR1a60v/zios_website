// Navbar, every page. Styles live in site-navbar.css (site head).
// 1. Adds the progressive blur layers behind the bar.
// 2. Desktop mega menu: Webflow keeps opening/closing the dropdowns; this follows their w--open class
//    and animates one shared white panel between them (position + size morph) while the old group
//    slides out and the new one slides in, so switching "Was wir tun" <-> "Unternehmen" is one motion
//    instead of a close and a separate open. Instant with reduced motion.
(function () {
  var nav = document.querySelector('.navbar');
  if (!nav) return;

  if (!nav.querySelector('.nav_blur')) {
    var blur = document.createElement('div');
    blur.className = 'nav_blur';
    blur.setAttribute('aria-hidden', 'true');
    blur.innerHTML = new Array(7).join('<div></div>');
    nav.insertBefore(blur, nav.firstChild);
  }

  var ul = nav.querySelector('.nav_menu_ul');
  if (!ul || !window.gsap) return;
  var items = Array.prototype.map.call(nav.querySelectorAll('.nav_menu_dd_list'), function (list) {
    return { list: list, layout: list.querySelector('.nav_menu_dd_layout') };
  }).filter(function (it) { return it.layout; });
  if (!items.length) return;

  var desktop = window.matchMedia('(min-width: 992px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;
  var bg = document.createElement('div');
  bg.className = 'nav_mm_bg';
  bg.setAttribute('aria-hidden', 'true');
  ul.insertBefore(bg, ul.firstChild);

  var layouts = items.map(function (it) { return it.layout; });
  var current = -1, latest = -1, raf = 0;

  function t(s) { return reduce.matches ? 0 : s; }

  // Layout box relative to the ul (where the panel lives), ignoring the slide offsets we add.
  function boxOf(i) {
    var el = items[i].layout, r = el.getBoundingClientRect(), u = ul.getBoundingClientRect();
    return {
      x: r.left - u.left - gsap.getProperty(el, 'x'),
      y: r.top - u.top - gsap.getProperty(el, 'y'),
      width: r.width,
      height: r.height,
      borderRadius: getComputedStyle(el).borderTopLeftRadius
    };
  }

  function openIndex() {
    if (latest >= 0 && items[latest].list.classList.contains('w--open')) return latest;
    for (var i = items.length - 1; i >= 0; i--) if (items[i].list.classList.contains('w--open')) return i;
    return -1;
  }

  function show(from, to) {
    var others = layouts.filter(function (el, i) { return i !== from && i !== to; });
    if (others.length) gsap.to(others, { autoAlpha: 0, duration: t(0.15), overwrite: true });

    if (to < 0) {
      gsap.to(bg, { autoAlpha: 0, scale: 0.98, duration: t(0.2), ease: 'power2.out', overwrite: 'auto' });
      if (from >= 0) gsap.to(layouts[from], { autoAlpha: 0, y: -8, duration: t(0.2), ease: 'power2.out', overwrite: true });
      return;
    }

    var box = boxOf(to);
    var panelVisible = gsap.getProperty(bg, 'opacity') > 0.05;
    if (panelVisible && from >= 0) {
      // Switch groups: morph the panel, cross-slide the content in the direction of travel.
      var dir = to > from ? 1 : -1;
      gsap.to(bg, { x: box.x, y: box.y, width: box.width, height: box.height, borderRadius: box.borderRadius,
        autoAlpha: 1, scale: 1, duration: t(0.5), ease: 'power3.out', overwrite: 'auto' });
      gsap.to(layouts[from], { autoAlpha: 0, x: -dir * 32, y: 0, duration: t(0.2), ease: 'power2.out', overwrite: true });
      gsap.fromTo(layouts[to], { autoAlpha: 0, x: dir * 32, y: 0 },
        { autoAlpha: 1, x: 0, duration: t(0.45), delay: t(0.08), ease: 'power3.out', overwrite: true });
    } else {
      // First open (or reopen while the panel was still fading out): drop in from just above.
      gsap.set(bg, { x: box.x, y: box.y, width: box.width, height: box.height, borderRadius: box.borderRadius, transformOrigin: '50% 0%' });
      gsap.fromTo(bg, { autoAlpha: panelVisible ? gsap.getProperty(bg, 'opacity') : 0, scale: 0.98 },
        { autoAlpha: 1, scale: 1, duration: t(0.35), ease: 'power3.out', overwrite: 'auto' });
      if (from >= 0) gsap.to(layouts[from], { autoAlpha: 0, duration: t(0.15), overwrite: true });
      gsap.fromTo(layouts[to], { autoAlpha: 0, x: 0, y: -8 },
        { autoAlpha: 1, y: 0, duration: t(0.4), delay: t(0.05), ease: 'power3.out', overwrite: true });
    }
  }

  function sync() {
    raf = 0;
    if (!desktop.matches) return;
    var next = openIndex();
    if (next === current) return;
    show(current, next);
    current = next;
  }

  function enable() {
    root.classList.add('nav-mm');
    current = -1;
    sync();
  }

  function disable() {
    root.classList.remove('nav-mm');
    gsap.killTweensOf(layouts.concat(bg));
    gsap.set(layouts.concat(bg), { clearProps: 'all' });
    current = -1;
  }

  var observer = new MutationObserver(function (records) {
    records.forEach(function (rec) {
      var i = items.findIndex(function (it) { return it.list === rec.target; });
      if (i >= 0 && rec.target.classList.contains('w--open')) latest = i;
    });
    if (!raf) raf = requestAnimationFrame(sync);
  });
  items.forEach(function (it) { observer.observe(it.list, { attributes: true, attributeFilter: ['class'] }); });

  window.addEventListener('resize', function () {
    if (current >= 0 && desktop.matches) {
      var box = boxOf(current);
      gsap.set(bg, { x: box.x, y: box.y, width: box.width, height: box.height });
    }
  });

  var onChange = function () { desktop.matches ? enable() : disable(); };
  if (desktop.addEventListener) desktop.addEventListener('change', onChange); else desktop.addListener(onChange);
  if (desktop.matches) enable();
})();
