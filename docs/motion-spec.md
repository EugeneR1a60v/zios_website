# Motion spec

One animation language for the whole site. When you add or change an animation, use these values. If something needs to differ, note it here.

**Library:** GSAP **3.15.0** (core, ScrollTrigger, SplitText). It is loaded once in the site footer (`webflow/custom-code/site-footer.html`) and registered globally. Page scripts keep a small "load GSAP if missing" fallback pinned to the same version.

**Everywhere:**
- Respect `prefers-reduced-motion`: show the end state, no animation.
- Elements hidden before their animation must always have a fallback that shows them if JS fails.

## Tokens

| Token | Value |
|---|---|
| Entrance ease | `power3.out` |
| Wipe / line ease | `power3.inOut` |
| Background settle ease | `power2.out` |
| Scroll trigger | `top 85%` (IntersectionObserver: `rootMargin: 0 0 -15% 0`), plays once |
| Fade-up | from `y: 32`, `autoAlpha: 0`, `0.8s`, stagger `0.1s` |

## Patterns

| Pattern | Spec | Used on |
|---|---|---|
| **Hero** (on load, after fonts are ready) | Background: `autoAlpha 0 → 1`, `scale 1.06 → 1`, `1.8s`, `power2.out`, at 0.<br>Eyebrow: `y 16`, fade, `0.8s`, at 0.<br>H1: SplitText lines in a mask, `yPercent 110 → 0`, `1s`, stagger `0.12`, at 0.1. Revert the split on complete.<br>Lead + CTA: `y 24`, fade, `0.8s`, stagger `0.12`, at `-=0.6`. | What we do, Capabilities, About Us, Our team & careers |
| **Section content** (headings, text, cards, list items) | Fade-up (tokens above), in DOM order. | All pages |
| **Image reveal** | Wrapper `clipPath inset(100% 0 0 0) → 0`, `1.2s`, `power3.inOut`; image inside `scale 1.15 → 1`, `1.6s`, `power3.out`. | About intro, Team |
| **Divider line** | `scaleX 0 → 1` from the left, `1.2s`, `power3.inOut`. | About stats, Team |
| **Numbers** | Rolling digit counter: each digit is a 0–9 strip, `1800ms` + `150ms` per later digit, `cubic-bezier(.16,1,.3,1)`, items `0.12s` apart. Symbols and words stay still; `aria-label` keeps the plain value. | Home Über Zios, About stats, Capabilities "Why" stats |
| **Tabs / panel switch** | Old panel fades out (`0.18s`), new panel's image wipes (`0.9s`, `power3.inOut`) and text rises (`y 24`, `0.6s`, stagger `0.08`). Mobile accordion: height `0.35–0.4s`, `power2.inOut`. | Capabilities "What can I do" |

## Deliberate exceptions

- **Home hero:** pinned scroll sequence with parallax mountains (`home-hero-parallax.js`). It's the signature moment, so it doesn't use the standard hero reveal.
- **Home section reveals** (`data-gsap-trigger="title"`) and sliders live in the external `app.js` bundle (`ndrewfrolov/zios`), which this project can't edit. Align them to this spec in that repo.
- **About Us extras:**
  - the timeline progress line is scrubbed with scroll;
  - the year boxes open from the centre line;
  - the Approach cards' icons pop (`back.out(2)`) and their ASCII art scans in (`steps(14)`).

  These are section-specific accents, built on the same base timings.
- **Hover micro-interactions** (WWD service rows, cards, buttons): CSS transitions of about 0.35–0.4s, outside this spec.
