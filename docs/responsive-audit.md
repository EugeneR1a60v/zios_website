# Tablet and mobile audit: kept pages (2026-10-14)

Pages: Home, What we do, Capabilities - Cybersecurity, About Us, and Our team & careers.

**Status: static pass done; visual pass pending.** This pass covers what can be read from Webflow without a browser:
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

## 5. Rendered pass, once network access is allowed

For each of the five pages, at 1024, 991, 768, 767, 479, 375 and 320 px (headless Chromium):
1. Full-page screenshots, compared against the Figma desktop frames for content parity.
2. Horizontal overflow check: `document.documentElement.scrollWidth > innerWidth`, plus the offending elements.
3. Computed font size of every text node, flagging anything under 16px that isn't a label (12px).
4. Tap targets under 44×44px.
5. Hero reveal, rolling numbers, sliders and accordion exercised by scripting scroll and clicks, with a check for console errors.
6. Then apply fix 1 on a staging branch and re-run steps 1–3 at tablet widths before publishing.
