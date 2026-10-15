// Responsive audit harness: loads each live page at several widths, scrolls through it,
// measures layout/type/tap-target/animation problems and saves screenshots.
// Blocked CDNs are served from local npm copies of the same versions.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://zios-test.webflow.io';
const PAGES = { home: '/', wwd: '/what-we-do', cap: '/cybersecurity', about: '/about-us', team: '/our-team' };
const WIDTHS = (process.env.WIDTHS || '1440,1024,768,600,375,320').split(',').map(Number);
const ONLY = process.env.PAGES ? process.env.PAGES.split(',') : Object.keys(PAGES);
const OUT = path.join(__dirname, process.env.FIX ? 'out-fix' : 'out');
fs.mkdirSync(OUT, { recursive: true });
const NM = path.join(__dirname, 'node_modules');

function local(url) {
  let m;
  if ((m = url.match(/cdn\.jsdelivr\.net\/npm\/gsap@[\d.]+\/dist\/(\w+\.min\.js)/))) return path.join(NM, 'gsap/dist', m[1]);
  if ((m = url.match(/cdn\.jsdelivr\.net\/npm\/swiper@\d+\/(swiper-bundle\.min\.(?:js|css))/))) return path.join(NM, 'swiper', m[1]);
  if (/cloudfront\.net\/js\/jquery-3\.5\.1/.test(url)) return path.join(NM, 'jquery/dist/jquery.min.js');
  if (/unpkg\.com\/deep-chat@2\.4\.2\/dist\/deepChat\.bundle\.js/.test(url)) return path.join(NM, 'deep-chat/dist/deepChat.bundle.js');
  if ((m = url.match(/cdn\.jsdelivr\.net\/gh\/strawberryjohn\/zios_website@([0-9a-f]+)\/(.+)$/))) {
    const f = path.join(__dirname, 'gh-' + m[1].slice(0, 8) + '-' + path.basename(m[2]));
    if (!fs.existsSync(f)) fs.writeFileSync(f, require('child_process').execSync(`git -C /home/user/zios_website show ${m[1]}:${m[2]}`));
    return f;
  }
  return null;
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const results = [];
  for (const key of ONLY) {
    for (const w of WIDTHS) {
      const touch = w <= 1024;
      const ctx = await browser.newContext({
        viewport: { width: w, height: w <= 600 ? 800 : w <= 1024 ? 1024 : 900 },
        deviceScaleFactor: 1, isMobile: w <= 600, hasTouch: touch,
      });
      const page = await ctx.newPage();
      const blocked = new Set(), errors = [];
      await page.route('**/*', route => {
        const url = route.request().url();
        const f = local(url);
        if (f) return route.fulfill({ path: f, contentType: f.endsWith('.css') ? 'text/css' : 'application/javascript' });
        if (/finsweet\/attributes/.test(url)) return route.fulfill({ body: '', contentType: 'application/javascript' });
        if (/netlify\.app|jsdelivr\.net\/gh\/|trycloudflare|lhr\.life|youtube|googletagmanager/.test(url)) { blocked.add(url.split('?')[0]); return route.abort(); }
        return route.continue();
      });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
      try {
        await page.goto(BASE + PAGES[key], { waitUntil: 'load', timeout: 60000 });
      } catch (e) { errors.push('goto: ' + e.message.slice(0, 120)); }
      if (process.env.FIX) await page.addStyleTag({ content: 'html{font-size:clamp(14px, calc(100vw / 1370 * 16), 16px) !important} @media (max-width: 991px){html{font-size:16px !important}} @media (max-width: 374px){html{font-size:calc(100vw / 375 * 16) !important}}' });
      await page.waitForTimeout(2500);
      // Scroll through the page to fire scroll-triggered reveals and counters.
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < total; y += Math.round((await page.viewportSize()).height * 0.6)) {
        await page.evaluate(yy => window.scrollTo(0, yy), y);
        await page.waitForTimeout(350);
      }
      await page.waitForTimeout(2500);
      const data = await page.evaluate(({ w, touch }) => {
        const vw = window.innerWidth;
        const sel = el => {
          const c = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
          return el.tagName.toLowerCase() + c;
        };
        const visible = el => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        const clipped = el => {
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const cs = getComputedStyle(p);
            if (/(hidden|clip)/.test(cs.overflowX) || /(hidden|clip)/.test(cs.overflow)) {
              const r = p.getBoundingClientRect();
              if (r.right <= vw + 1 && r.left >= -1) return true;
            }
            if (cs.position === 'fixed') return false;
          }
          return false;
        };
        const all = [...document.querySelectorAll('body *')];
        // Horizontal overflow
        const over = [];
        for (const el of all) {
          if (!visible(el)) continue;
          const r = el.getBoundingClientRect();
          if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) over.push({ s: sel(el), l: Math.round(r.left), r: Math.round(r.right) });
        }
        // Text sizes (leaf text)
        const small = {};
        for (const el of all) {
          if (!visible(el)) continue;
          const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
          if (!own) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 15.5) {
            const k = sel(el) + ' @' + fs.toFixed(1) + 'px';
            small[k] = (small[k] || 0) + 1;
          }
        }
        // Tap targets
        const taps = [];
        if (touch) for (const el of document.querySelectorAll('a[href], button, [role=button], input, select, textarea')) {
          if (!visible(el)) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 44 || r.height < 44) taps.push(sel(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        // Reveal / animation failures: things meant to animate in that are still invisible after scrolling.
        const stuck = [];
        for (const el of document.querySelectorAll('[data-reveal],[data-reveal-item],[data-reveal-img],[data-ab-reveal],[data-ab-split],[data-ab-stat],[data-ab-tl-item],[data-ab-appr-card],h1,h2,.wwdhero_text,.why_stat_number,.why_stat_title')) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none') continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1) stuck.push(sel(el) + ' "' + el.textContent.trim().slice(0, 30) + '"');
        }
        const h1 = [...document.querySelectorAll('h1')].filter(visible).map(h => h.textContent.trim().slice(0, 40) + ' @' + getComputedStyle(h).fontSize);
        const body = [...document.querySelectorAll('p')].filter(visible).map(p => parseFloat(getComputedStyle(p).fontSize));
        const med = body.sort((a, b) => a - b)[Math.floor(body.length / 2)] || 0;
        return {
          root: getComputedStyle(document.documentElement).fontSize,
          scrollW: document.documentElement.scrollWidth, vw, h: document.documentElement.scrollHeight,
          over: over.slice(0, 15), overCount: over.length,
          small, taps: [...new Set(taps)].slice(0, 25), tapCount: taps.length,
          stuck: stuck.slice(0, 15), h1, medianP: med,
          gsap: window.gsap ? gsap.version : null, swiper: !!window.Swiper,
          userSelect: getComputedStyle(document.querySelector('p') || document.body).userSelect,
        };
      }, { w, touch });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT, `${key}-${w}.jpg`), fullPage: true, type: 'jpeg', quality: 45 });
      results.push({ page: key, w, ...data, errors: [...new Set(errors)].slice(0, 10), blocked: [...blocked] });
      console.log(key, w, 'root', data.root, 'overflow', data.scrollW > data.vw ? `${data.scrollW}>${data.vw}` : 'no', 'stuck', data.stuck.length, 'errors', errors.length);
      await ctx.close();
    }
  }
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
  await browser.close();
})();
