# Performance audit: kept pages (2026-10-14)

Pages audited: Home, What we do, Capabilities - Cybersecurity, About Us, and Our team & careers.

**Method and limits.** This is a static audit of what each page loads, read from Webflow through the Data API:
- site and page custom code;
- image assets (format, size, responsive variants);
- custom fonts.

There are no measured Lighthouse or Core Web Vitals numbers yet. The live site (`zios-test.webflow.io`) is blocked from this environment, and Google's shared PageSpeed API key was over its daily quota. Re-run PageSpeed on each page before and after the fixes (step 0 below). Sizes are Webflow's stored originals; on the published site Webflow serves responsive variants of `<img>` elements, so real transfer is often smaller.

## Summary

| # | Fix | Pages | Impact | Effort | Where |
|---|---|---|---|---|---|
| 1 | Compress the Capabilities hero JPEGs (1.44 MB + 0.47 MB) and the founder PNG (0.61 MB) to AVIF | Cap, Team | **High** (LCP) | 10 min | Webflow assets |
| 2 | Stop hiding the hero heading until GSAP downloads | WWD, Cap, About, Team | **High** (LCP) | 1–2 h | Page custom code |
| 3 | Load the Deep Chat bundle only when the chat is opened | All | **High** (JS) | 1 h | Site head |
| 4 | Use one GSAP version, loaded once and cached | All | Medium | 1 h | Page custom code |
| 5 | Move the 25–40 KB of inline page code into cached files | All | Medium | 2–3 h | Custom code / bundle |
| 6 | Convert Regular and Light fonts from OTF to WOFF2; preload the body font | All | Medium | 30 min | Webflow fonts |
| 7 | Make Swiper load only where it's used, and preconnect the third-party hosts | All | Medium | 30 min | Site code |
| 8 | Delete the hidden legacy sections | Home, WWD, Cap, About, Team | Medium | 1 h | Designer |
| 9 | Compress the large PNGs used by components and CTAs | Cap, WWD, About | Medium | 10 min | Webflow assets |
| 10 | Clean up Home custom code (dead dev tunnels, old slider CSS) | Home | Low (also a safety fix) | 15 min | Page custom code |
| 11 | Check: `#page-loader` overlay, `app.js` on non-Home pages, video/Rive usage | All | Unknown until verified | 30 min | Designer |

Step 0: run PageSpeed Insights (mobile and desktop) on all five pages after the next publish and save the scores here as the baseline.

## Details

### 1. Oversized images (LCP)

| Asset | Page | Now | Action |
|---|---|---|---|
| `capability-hero-cybersecurity.jpg.jpeg` (`6ac7c74f…`) | Cap hero, likely the LCP image | 1.44 MB JPEG | AVIF; expect around 150–250 KB |
| `capability-hero-cybersecurity-texture.jpeg` (`6ac7c766…`) | Cap hero layer | 482 KB JPEG | AVIF |
| `team-founder-daniel-zinner.png` (`6acc26e3…`) | Team founder photo | 624 KB PNG | AVIF/WebP |
| `cta-cyber-handshake.png.png` (`6ac81cb6…`) | Probably the Cap CTA component | 3.66 MB PNG | AVIF |
| `cta-cyber-glow.png.png` (`6ac81cb9…`) | Probably the Cap CTA component | 1.21 MB PNG | AVIF |
| `wwd-reinvention-ascii.png` (`6ac6ea4b…`) | WWD Reinvention panel (may be replaced by the canvas) | 1.49 MB PNG | AVIF, or delete if unused |
| `wwd-products-hosting-rack.png` (`6ac6ea46…`) | WWD products | 0.83 MB PNG | AVIF |
| `about-approach-ascii-*.png` (about 0.8–0.9 MB each) | About cards, replaced by the canvas | PNG | Delete if no longer referenced |

- Webflow can convert these in place: Assets › compress to AVIF, or the API `compress_assets`. The asset ID stays the same, so nothing in the Designer needs relinking. It does **replace the original file**, so I need your OK first.
- Home is already in good shape: all AVIF/SVG, about 0.5 MB of page images in total.
- The hero/LCP image should not be `loading="lazy"`; set `fetchpriority="high"` on it. Home's hero layer already does this. Check the Cap and WWD hero backgrounds. If they are CSS background images, they get neither a srcset nor a priority hint; an `<img>` with `object-fit: cover` is better.

### 2. Hero text hidden until animations load (LCP)

- WWD, Cap, About and Team hide the hero heading (`html.wwd-reveal-pending`, `cap-reveal-pending`, `ab-js`, `team-reveal`) until GSAP has loaded from jsDelivr.
- The fallback un-hide fires after 3 s (WWD, Cap) or 4 s (About).
- The H1 is usually the LCP element, so LCP waits on: DNS + TLS to jsDelivr → gsap.min.js → SplitText (WWD, Cap) → the timeline.
- On a slow mobile connection that's easily 1.5–3 s of blank hero.
- Fixes, from simplest:
  - Cut the fallback timeout to around 1 s.
  - Preload GSAP in the page head: `<link rel="preload" as="script" href=".../gsap.min.js">`.
  - Best: animate from a visible state, for example a subtle rise with `opacity` starting at 0.01 and not 0, so the browser counts the paint. Alternatively, leave the H1 out of the reveal and animate only the eyebrow, lead text and CTA.

### 3. Deep Chat loaded on every page

- `<script type="module" src="https://unpkg.com/deep-chat@2.4.2/dist/deepChat.bundle.js">` is in the **site head**, so every page downloads and parses it.
- The bundle is several hundred KB of JS. It runs in `demo="true"` mode, so it isn't wired to a real backend yet.
- Fix: inject the script on the first open of the chat widget (or on idle via `requestIdleCallback`), and only on pages that show the widget.
- Also: unpkg is slow and not meant for production. Self-host the file or pin it on jsDelivr.

### 4. GSAP version mismatch

- Home, About and Team load **GSAP 3.12.5** (+ ScrollTrigger); WWD and Cap load **3.13.0** (+ SplitText).
- These are different URLs, so the browser caches them separately, and moving between pages downloads GSAP again.
- 3.13 also adds SplitText for free; use one version (3.13.x) everywhere.
- Load it once at site level, or switch on Webflow's built-in GSAP (Site settings › GSAP). That way the page scripts don't each inject their own copy.
- Related bug risk: the site-wide FAQ accordion script calls `gsap.timeline()` on `DOMContentLoaded`. On pages where GSAP is injected later by a page script, `gsap` can be undefined at that moment. The FAQ accordion is on Capabilities, and on Home if `app.js` doesn't bundle GSAP. Check the console on Cap after publish.

### 5. Inline page code is never cached

The inline custom code alone is about 40 KB on Home, 34 KB on Cap, 33 KB on About and 25 KB on WWD. It is re-sent with every HTML response and can't be cached across pages. The ASCII-mountain script is copied into both Home and WWD.
- Move scripts into versioned files: the Netlify bundle, or one file per feature on a CDN. They then cache across pages, and the ASCII-mountain script is downloaded once.
- Minify them; the source files in `webflow/custom-code/` stay readable.
- Keep only the small "reveal pending" class switches inline in the head.

### 6. Fonts

- The Allianceno Regular (400, body text) and Light (300) faces are **OTF**; Medium and SemiBold are already WOFF2. OTF is typically 30–50% larger.
- Upload WOFF2 versions of Regular and Light, using the same family name and weights, and remove the OTFs once they're swapped. I can convert them if you send me the OTF files.
- `font-display: swap` is set on all four faces, which is good.
- Preload the body face (Regular 400 WOFF2) in the site head.
- There are 16 `.woff` files in Assets (probably leftover template fonts). They only cost something if a style still references them; check in the Designer, then clean up.

### 7. Third-party hosts and Swiper

- Site head: the Swiper CSS (jsDelivr) is **render-blocking** and is on every page. Swiper JS loads synchronously in the site footer.
- Swiper is used on Home (news) and Team (leaders); WWD has a slider config too.
- Fix: move the Swiper CSS and JS to the page code of pages that use Swiper, or load the CSS non-blocking (`media="print" onload="this.media='all'"`).
- Add `<link rel="preconnect">` for `cdn.jsdelivr.net` and `zios-webflow.netlify.app` (Home); drop `unpkg.com` after step 3.
- Finsweet Attributes v2 (`async type=module`) is used only for `fs-scrolldisable`. Keep it, or replace it with a few lines of CSS/JS.

### 8. Hidden legacy sections

The old sections are still in the HTML, just hidden: old hero, old stats, timeline, "What can you do" with lorem ipsum, old expertise slider, `indastries_sec`. They:
- inflate the DOM;
- fetch their non-lazy images even while `display: none`;
- may run their scripts;
- duplicate H1s (see the SEO audit).

Delete them once the redesigns are approved. Until then, at least set their images to lazy.

### 9. Large PNGs in components

See table 1 (`cta-cyber-*`, `wwd-*`, `about-approach-ascii-*`). One `compress_assets` run to AVIF covers all of them. Before deleting any of them, confirm they're unused with the Designer's asset usage check.

### 10. Home custom code cleanup

- Home's head and footer still contain commented-out links to **developer tunnels** (`*.trycloudflare.com`, `*.lhr.life`) and a GitHub `@main` build.
- They're harmless while commented. But uncommenting one by mistake would load code from a temporary public tunnel, so remove them.
- Also remove the commented old Swiper configs and the CSS for the old, hidden expertise slider ("kept until v3 is approved").

### 11. To verify in the Designer

- **`#page-loader`.** The site head styles a full-screen black overlay (`#page-loader`, z-index 9999), and the "LOADER SCRIPT" block is empty. If any page or component still contains `#page-loader`, it covers the page until something hides it, which delays the first paint the visitor sees. Remove the element or the CSS.
- **`app.js` / `app.css` on non-Home pages.** Webflow page code loads them only on Home. CLAUDE.md says every page uses them, so they may come through a component embed. Confirm where they come from, since the CSS is render-blocking from a third-party origin.
- **Heavy media.** Two MP4s (4.6 MB, 4.1 MB), a 1.6 MB Rive file (`map.riv`) and a 0.9 MB Lottie JSON are in Assets. If any of them is on these pages: video needs `preload="none"` + a poster, and Rive/Lottie should only load when scrolled into view.

## Already good

- Home images are AVIF/SVG with responsive variants, and the hero image has `fetchpriority="high"`.
- The ASCII canvases (Home hero, Über Zios, About cards) pause off-screen with IntersectionObserver and respect `prefers-reduced-motion`.
- GSAP is injected only when missing, and pages fall back to visible content if it fails.
- All custom fonts use `font-display: swap`.
