# Tablet and mobile audit: kept pages (2026-10-14)

Pages: Home, What we do, Capabilities - Cybersecurity, About Us, and Our team & careers.

**Status: static pass and rendered pass done (2026-10-14).** This pass covers what can be read from Webflow without a browser:
- every class's breakpoint styles (tablet ≤991, mobile landscape ≤767, mobile portrait ≤479);
- the CSS in components and custom code;
- the animation scripts.

The rendered pass (screenshots at 991 / 768 / 767 / 479 / 375 / 320 px, overflow checks, animation checks) needs `zios-test.webflow.io` and `cdn.prod.website-files.com` allowed in this environment's network settings.

## 1. Critical: the root font size makes everything 25% smaller on tablets

The "Fluid pages / styles" component (used on WWD, Capabilities, About and Team) scales the root font size. Every rem value scales with it: type variables, spacing and widths.

```css
html { font-size: clamp(0.75rem, calc(100vw / 1370 * 16), 1rem); }               /* ≥ 768px */
@media (max-width: 767px) { html { font-size: clamp(0.625rem, calc(100vw / 375 * 16), 1rem); } }
```

Home doesn't use the component. It has its own embed with different numbers (`/1440`, mobile switch at **479px** instead of 767px).

What a visitor gets (1rem = root):

| Viewport | Typical device | Root on WWD / Cap / About / Team | Root on **Home** | Body text (1rem) | H1 (tablet mode 4rem / mobile 3rem) |
|---|---|---|---|---|---|
| 1440 | laptop | 16px | 16px | 16px | 80px |
| 1280 | laptop | 14.9px | 14.2px | 14–15px | ~72px |
| 1024 | iPad landscape | **12px** | **12px** | **12px** | ~60px |
| 991 → 768 | iPad portrait, small tablets | **12px** | **12px** | **12px** | **48px** (spec 64) |
| 767 → 480 | large phones, landscape | 16px | **12px** | 16px / **12px on Home** | 48px / **36px on Home** |
| 375–479 | phones | 16px | 16px | 16px | 48px |
| 360 | small Android | 15.4px | 15.4px | 15px | 46px |
| 320 | iPhone SE 1st gen | 13.7px | 13.7px | 14px | 41px |

**Why it matters:**
- The approved type scale (tracker) sets tablet and mobile sizes on the assumption that 1rem = 16px. On every tablet, and on Home between 480 and 767px, the actual root is 12px.
- Body copy renders at **12px**, which breaks the "base text is 16px" rule. Spacing and paddings shrink by the same 25%.
- The type scale's tablet values are never seen as specified: H1 64 → 48, H2 48 → 36.
- Home and the other pages also look different from each other between 480 and 767px.

**Recommended fix.** One shared embed, used by all pages including Home (remove Home's own copy):

```css
/* Fluid only on desktop; tablet and mobile use the type scale's own modes at a 16px root. */
html { font-size: clamp(0.75rem, calc(100vw / 1370 * 16), 1rem); }
@media (max-width: 991px) { html { font-size: 1rem; } }
@media (max-width: 374px) { html { font-size: calc(100vw / 375 * 16); } } /* keep 320px phones in proportion */
```

**Risk.** Tablet layouts were tuned while the root was 12px, so on tablet everything grows by 33%. Any fixed rem width or height (for example containers or cards wider than 48rem) can then overflow at 768px. This change has to be verified visually per page before publishing. Do it in the rendered pass.

## 2. High

| # | Issue | Where | Fix |
|---|---|---|---|
| 2.1 | **`user-select: none` on every element.** Visitors can't select or copy any text, including the phone number, email address and job titles. Long-press copy on mobile is blocked too. It's an accessibility problem and a conversion problem. | Global Styles component, first embed | Remove the rule. If needed, keep it only on decorative layers (`.hero_layer`, canvases, sliders). |
| 2.2 | **Home hero pin on mobile.** The hero is pinned for `+=200%` of scroll on every device. With no `ignoreMobileResize`, iOS/Android toolbar collapse triggers a ScrollTrigger refresh, which typically shows as a jump or a stutter mid-scroll. | `home-hero-parallax.js` | Add `ScrollTrigger.config({ ignoreMobileResize: true })`, size the hero in `svh`, and consider a shorter pin (`+=120%`) below 768px. Verify on a real iPhone. |
| 2.3 | **Stat numbers use three different sizes for the same role.** Home "Über Zios" stats use the H2 style (68 / 48 / 40). About hero stats and Capabilities "Why" stats are hard-coded at 3rem → 2.5rem (48 / 40). | `.aboutus_item_num`, `.abouthero_stat_num`, `.why_stat_number` | Pick one step for "stat number" and apply it everywhere (type rule: same role, same style). |

## 3. Medium / low

| # | Issue | Where | Fix |
|---|---|---|---|
| 3.1 | Cookie banner buttons drop to **14px** (0.875rem) at ≤479, which is off the 4px grid and below base. The banner copy is also English on a German page. | `.cookie_ban_btn`, `.cookie_ban_btn.is-secondary` | Use the base 16px (or the 12px label step); translate the copy. |
| 3.2 | Home products: the "Coming Soon" hosting card (`.swiper-slide.products.is-4`) is hidden at ≤991, and the "Coming Soon" shop card (`is-3`) is hidden at ≤479. Their message doesn't appear on those screens. | Home, Produkte & Plattformen | Confirm this is intended. If the teasers matter, keep them in the mobile slider. |
| 3.3 | Expertise slider tab labels drop to 12px on mobile and wrap. This is within the label step, but check that three labels fit 375px without breaking mid-word. | `home-expertise-v3.css` | Visual check. |
| 3.4 | The 240px "24/7" (`.aboutus_number`) steps to 160 → 120px; fine. With the tablet root at 12px it renders at 180px. Re-check after fix 1. | Home Über Zios | Visual check. |
| 3.5 | Chat widget: `deep-chat` has inline `width: 480px; height: 500px`. CSS overrides it to 100%, and the open panel is capped at 20 units on ≤479. Check that the open widget doesn't cover the whole screen with no way to close it on small phones. | Home | Visual check. |

## 4. Checked and fine

- **Grids collapse correctly:**
  - Leistungsbereiche mosaic: 16 → 2 → 1 columns.
  - Reviews: 3 → 1.
  - Capabilities "Why" row: 3 → 1.
  - Products: 4 → 2 → swipeable row.
  - About approach cards: 400px text columns are capped by `max-width: 100%` and go full width on mobile.
- **Hidden on smaller screens, purely decorative:** Leistungsbereiche grid cells and strips (`.services_cell`, `.services_card_strip`), CTA visual 2.
- **Capabilities "What can I do":** tabs on desktop, an ordered accordion on mobile (panel under its own title); the script switches at 768px.
- **Expertise slider:** mobile layout via its embed (taller slides, smaller nav, wrapping labels, tighter section padding).
- **About timeline:** the line moves to the left on mobile and every box opens to the right.
- **Animations on touch devices:**
  - All reveal scripts use the same motion spec on every breakpoint. Heroes split lines after fonts load, so line breaks are measured at the real width.
  - Hover-only effects are gated to mouse pointers (WWD service rows, Capabilities tab hover) and don't hide content on touch.
  - Every script respects `prefers-reduced-motion`.
  - The ASCII canvases pause off-screen.
- **Duplicate H1s are not in the published HTML.** The second hero on WWD, About and Team sits in sections set to "Visible: off", which Webflow doesn't render. *(This corrects SEO audit item 2.)*

## 5. Rendered pass (headless Chromium, live site)

Each page was loaded at 1440 / 1024 / 768 / 600 / 375 / 320 px and scrolled through to fire every reveal, then measured.
- Screenshots: `docs/responsive-audit/*.jpg`.
- Raw numbers: `measurements.json`.
- Harness: `audit-harness.js`.

**Fidelity notes:**
- The blocked CDNs (GSAP, Swiper, jQuery, Deep Chat, the repo-hosted `section-reveal.js`) were served from identical npm/git copies.
- Home's external `app.js` / `app.css` (Netlify) couldn't be loaded, so Home renders without that layer. Re-check Home once `zios-webflow.netlify.app` is allowed.

### Confirmed

| Check | Result |
|---|---|
| Root font size | 1024 and 768: **12px on all five pages**; 600: 12px on Home, 16px elsewhere; 375: 16px; 320: 13.7px. Tablet body text is 12px and the tablet H1 48px (spec 64). Finding 1 is confirmed. |
| Horizontal overflow | None, at any width, on any page. |
| Animations | Every reveal target is visible after scrolling (no stuck elements), GSAP 3.15.0 and Swiper load on every page, and there are no JS errors. Home's two errors are the blocked bundle. |
| Phone text sizes (375) | Everything is ≥16px except labels (12px) and Home's hero intro `.hero_text`, which is **14px**. |
| **Root-font fix, tested** | With `html{font-size:clamp(14px, 100vw/1370*16, 16px)}` plus 16px at ≤991, all five pages stay overflow-free at 1100 / 1024 / 768 / 600. The only visual casualty seen: the large footer "Zios" wordmark clips at 768 (`*-768-with-root-fix.jpg`). It needs a % or vw width. |

### New findings from the screenshots

| # | Severity | Issue | Page / width | Fix |
|---|---|---|---|---|
| R1 | High | **About CTA text is cut off.** "From tech to AI, we help clients rethink and rebu…" runs past the panel at 375 and is clipped. | About Us, ≤479 | Give `.aboutcta_text` `width: 100%` on mobile (its 33.375rem desktop width wins over `max-width` inside the flex panel). |
| R2 | High | **Placeholder content is live:** the FAQ shows "AMET SIT" and "LOREM DO" questions, and every item is numbered **[00]**. | What we do, Cybersecurity | Replace or remove the lorem FAQ items in the CMS; fix the numbering (Home numbers correctly). |
| R3 | High | **Placeholder team bios are live:** every executive card says "Position" and "A few words about him and his background… Not more please." | Our team & careers | Fill in the Team CMS items (role and bio) or hide the section until ready. |
| R4 | Medium | **Headings are forced into title case** with `text-transform: capitalize`. In German that's wrong: "Ihr Partner **Für** Sichere **Digitale** Infrastruktur", "Was **Unsere** Kunden **Über** Zios Sagen", "IT **Von** Morgen", "Mehr **Erfahren**". It's also inconsistent in English ("News And Insights"). | All pages | Remove `capitalize` from the heading styles and write the copy in the right case. |
| R5 | Medium | **Tap targets under 44×44px at phone width:**<br>• text links, 21px tall<br>• footer links, 33–36px<br>• FAQ toggles, 38px<br>• slider arrows, 32px<br>• slider dots, 8px<br>• LinkedIn icons, 24px<br>• logo, 40×15 (65×25 on Home) | All pages | Add vertical padding to links and toggles, make arrows 44px, give dots a larger invisible hit area. Make the logo the same size on all pages. |
| R6 | Medium | **Home tablet:** the "Zios Hosting" card title collides with its button, and the Über Zios intro text sits cramped under the title (at a 12px root, and without app.css). | Home, 768 | Re-check after the root fix and with the bundle loaded. |
| R7 | Low | Home hero on phones: large empty band between the CTA and the intro text, which is small (14px) and centred low. The cookie banner covers most of the first screen. | Home, 375 | Tighten the hero on mobile; use 16px intro text; make the cookie banner more compact. |
| R8 | Low | Nav logo has low contrast on the Cybersecurity hero (white logo on a light image). | Cybersecurity, 375 | Darken the top of the hero image or add a scrim. |

### Animation timing outside the motion spec (hosted scripts)

The page-level scripts follow `docs/motion-spec.md`. Three **registered (hosted) scripts** that I didn't touch in the alignment pass differ slightly:

| Script | Pages | Now | Spec |
|---|---|---|---|
| `SectionReveal` (jsDelivr, pinned to commit `2b741df`) | What we do, Cybersecurity | y 40, 0.9s, stagger 0.15, trigger −20% | y 32, 0.8s, stagger 0.1, trigger 85% |
| `HomeReviewsReveal` | Home | 1.1s, stagger 0.15, top 88% | 0.8s, 0.1, 85% |
| `wwdCoreIndustriesReveal` | What we do | 0.8 / 1s, stagger 0.05–0.08, 85% | close enough |

`HomeHeroReveal` already matches the hero spec, and `HomeAboutCountUp` uses the same rolling curve as the other counters.

`SectionReveal` is also fragile: it loads from `cdn.jsdelivr.net/gh/strawberryjohn/zios_website@…`. The repo has since moved to `EugeneR1a60v/zios_website`. Moving it into the page footer code (like the other page scripts) removes that dependency.

## 6. Follow-ups fixed (2026-10-14, staged)

- **About Us, Reinvention (phones):** the text group grew to its 534px paragraph and clipped the copy off-screen; `aboutcta_text_group` now has `max-width: 100%`. The section kept a 36rem min-height on phones, leaving ~220px of empty blue under the button; it now hugs the content with 5rem top and bottom.
- **Button Primary:** arrow overlapped the caption (36px reserved for a 40px arrow + inset). Gap now 48px (≥768) / 24px (phones), full width on phones. Verified by injecting the staged CSS into the live pages: desktop gaps 48px or more on all 14 buttons; phones full container width; tablet 36px while the 12px root-font issue (section 1) remains.
- **Published 2026-10-14** (with the news section, Home tablet fixes and About changes). Checked on the live site: all 14 Button Primary instances on the five pages are full width, 44px tall and 16px on phones; desktop caption-to-arrow gaps are 48px (one reads 47px from subpixel rounding). Verification turned up phone-only overrides the simulation hadn't covered, now removed: 18px text on the Light / Wide and White variants, 14px on Dark, and fixed phone widths on `button-wr.is-hero`, `wwdreinvent_btn_wr` and `greetings_btn_wr.u-display-inline-flex`. `wwdproducts_btn_wr` is now a minimum width. The old `aboutcta_btn*` classes are deleted.
