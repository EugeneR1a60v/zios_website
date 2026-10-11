// About us, Approach and Mission cards: the three ASCII artworks drawn live as
// real characters on a canvas (replaces the cropped PNG backgrounds, which did
// not scale with the cards).
// The maps are traced from the Figma artwork ('ascii-art 3', 'ascii-art (1) 2',
// 'ascii-art (2) 2') with Figma's crop applied: the source is a character grid
// on a 9.6 x 16px pitch; every visible cell's brightness became a level 1-7
// (0 = empty) drawn as one of ' .:-=+*#'. Rows are run-length encoded: '0'-'7'
// are levels, 'a'-'z' are runs of 2-27 empty cells. w/h/px/py/x0/y0 are in the
// Figma container's px (pillar 772x244, mission 908x269, trust 677x204); the
// canvas scales them to the live box, so the art always fills its card exactly.
// Animation: glyphs flicker to neighbouring levels and the odd one sparkles,
// only while the card is on screen; reduced motion gets a still frame.
// Built from about-approach-ascii.src.js + traced data by tools/build-about-ascii.py.
(function () {
/*@@DATA@@*/
  var RAMP = ' .:-=+*#';
  var ALPHA = [0, 0.35, 0.45, 0.55, 0.66, 0.76, 0.88, 1];
  var TICK_MS = 120, SWAP = 0.006, SPARK = 0.0015, SPARK_MS = 1400;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function decode(map) {
    return map.split('|').map(function (row) {
      var out = [];
      for (var i = 0; i < row.length; i++) {
        var k = row.charCodeAt(i);
        if (k >= 97) { for (var n = k - 95; n > 0; n--) out.push(0); }
        else out.push(k - 48);
      }
      return out;
    });
  }

  function setup(host, art) {
    var grid = decode(art.map), cells = [];
    grid.forEach(function (row, r) {
      row.forEach(function (l, c) {
        if (l) cells.push({ c: c, r: r, base: l, l: l, glow: 0, t0: 0 });
      });
    });

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var color = getComputedStyle(document.documentElement).getPropertyValue('--swatch--white-100').trim() || '#fcfcfc';
    var s = 1, dpr = 1;

    function resize() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      s = w / art.w;
      draw(performance.now());
    }

    function draw(now) {
      ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
      ctx.clearRect(0, 0, art.w, art.h);
      ctx.font = (art.py * 1.02).toFixed(2) + 'px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i], a = ALPHA[cell.l], ch = RAMP[cell.l];
        if (cell.glow) {
          var g = 1 - (now - cell.t0) / SPARK_MS;
          if (g <= 0) cell.glow = 0;
          else { a = a + (1 - a) * g; if (g > 0.5) ch = '#'; }
        }
        ctx.globalAlpha = a;
        ctx.fillText(ch, art.x0 + (cell.c + 0.5) * art.px, art.y0 + (cell.r + 0.5) * art.py);
      }
      ctx.globalAlpha = 1;
    }

    var visible = false, last = 0;
    function frame(now) {
      if (!visible) return;
      if (now - last >= TICK_MS) {
        last = now;
        for (var i = 0; i < cells.length; i++) {
          var cell = cells[i], r = Math.random();
          if (r < SWAP) cell.l = Math.max(1, Math.min(7, cell.base + (Math.random() < 0.5 ? -1 : 1)));
          else if (r < SWAP * 3) cell.l = cell.base;
          if (!cell.glow && Math.random() < SPARK && cell.base >= 3) { cell.glow = 1; cell.t0 = now; }
        }
      }
      draw(now);
      requestAnimationFrame(frame);
    }

    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize', resize);
    if (still || !window.IntersectionObserver) return;
    new IntersectionObserver(function (entries) {
      var was = visible;
      visible = entries[0].isIntersecting;
      if (visible && !was) requestAnimationFrame(frame);
    }).observe(host);
  }

  function init() {
    if (!window.HTMLCanvasElement) return;
    document.querySelectorAll('.aboutappr_ascii').forEach(function (host) {
      var key = ['pillar', 'mission', 'trust'].filter(function (k) { return host.classList.contains('is-' + k); })[0];
      if (key && !host.querySelector('canvas')) setup(host, ART[key]);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
