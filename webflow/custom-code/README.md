# Custom code

Source of truth for any code added to Webflow: HTML embeds, site/page head and footer code, and registered scripts.
Name each file after where it lives, e.g. `site-head.html`, `page-home-footer.html`, `embed-hero-video.html`.

## About us page

- `page-about-head.html` → About us page head code: styles (text-box trim, card fills, reveal start states, word masks) followed by `about-approach-ascii.js` in a script tag.
- `about-approach-ascii.js` is generated: edit `about-approach-ascii.src.js` (renderer) and run `python3 tools/build-about-ascii.py` (traces the Figma ASCII PNGs into character maps), then paste the result into the head block.
- `page-about-footer.html` → About us page footer code; it is `about-reveal.js` wrapped in a script tag. Edit the `.js`, then rebuild the `.html`.
- `about-cta.css` → HTML embed (first child of `.aboutcta_sec`): CTA gradient, right-to-left shade, text trim, button arrow hover.

## Shared components

- `news-section.css` → HTML embed inside the **News / Section** component (`u-embed-css`, all pages): card image hover zoom, Medium H3 title, text trim.
