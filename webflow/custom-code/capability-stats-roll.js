// Numbers roll into place digit by digit when the stats scroll into view: the same
// counter as the Home "Über Zios" numbers and the About us stats (docs/motion-spec.md).
// Every digit is a 0-9 strip that slides up to its target like a mechanical counter;
// later digits spin more and settle a little later. Symbols ($ . % , +) and words stay
// put. Screen readers get the plain value. Reduced motion: numbers stay static.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ROLL_MS = 1800, ROLL_STAGGER = 150, ITEM_STAGGER = 0.12;

  function buildRoll(el) {
    var txt = el.textContent.trim();
    if (!/\d/.test(txt)) return null;
    var cs = getComputedStyle(el), lh = parseFloat(cs.lineHeight);
    if (isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.2;
    el.setAttribute('aria-label', txt);
    el.textContent = '';
    el.style.fontVariantNumeric = 'tabular-nums';
    var k = 0, strips = [];
    txt.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      if (!/\d/.test(ch)) { span.textContent = ch; el.appendChild(span); return; }
      span.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;height:' + lh + 'px;line-height:' + lh + 'px';
      var strip = document.createElement('span');
      strip.style.cssText = 'display:block;will-change:transform';
      var n = ++k * 10 + +ch, html = ''; // later digits spin more
      for (var i = 0; i <= n; i++) html += '<span style="display:block">' + (i % 10) + '</span>';
      strip.innerHTML = html;
      span.appendChild(strip);
      el.appendChild(span);
      strips.push({ strip: strip, y: -n * lh });
    });
    return strips;
  }

  function roll(strips, delay) {
    strips.forEach(function (s, i) {
      s.strip.style.transition = 'transform ' + (ROLL_MS + i * ROLL_STAGGER) + 'ms cubic-bezier(.16,1,.3,1) ' + Math.round(delay * 1000) + 'ms';
      s.strip.style.transform = 'translateY(' + s.y + 'px)';
    });
  }

  function init() {
    if (!('IntersectionObserver' in window)) return;
    var groups = new Map();
    document.querySelectorAll('.why_stat_number, .why_stat_title').forEach(function (el) {
      if (!el.offsetParent || el.classList.contains('w-dyn-bind-empty')) return; // hidden or empty CMS field
      var host = el.closest('section') || el.parentNode;
      if (!groups.has(host)) groups.set(host, []);
      groups.get(host).push(el);
    });
    groups.forEach(function (els, host) {
      var rolls = els.map(buildRoll).filter(Boolean);
      if (!rolls.length) return;
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        rolls.forEach(function (strips, i) { roll(strips, i * ITEM_STAGGER); });
      }, { rootMargin: '0px 0px -15% 0px' });
      io.observe(host);
    });
  }

  function start() { (document.fonts ? document.fonts.ready : Promise.resolve()).then(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
