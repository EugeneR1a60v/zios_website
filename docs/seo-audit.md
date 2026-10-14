# SEO audit: kept pages (2026-10-14)

Scope: the five pages being kept: Home, What we do, Capabilities - Cybersecurity, About Us, and Our team & careers. All other static pages were set to draft. Content was read from Webflow's staged (unpublished) state through the Data API. The live webflow.io site could not be fetched from this environment, so rendered-HTML checks (canonical, `lang`, robots, Core Web Vitals) are still open.

## Applied in Webflow (staged, not published)

| Page | Slug | SEO title | Meta description |
|---|---|---|---|
| Home | `/` | IT-Betreuung & Cybersecurity aus Niederösterreich \| Zios (56) | Zios verbindet IT-Betreuung, Cybersecurity, Cloud und KI-Automatisierung für Unternehmen, Gemeinden und Organisationen. Jetzt kostenlose Erstberatung sichern. (158) |
| What we do | `/what-we-do` | IT Services: Cybersecurity, AI, Cloud & Managed IT \| Zios (57) | Cybersecurity, AI and automation, GDPR and NIS2 compliance, managed IT and cloud backup: Zios delivers end-to-end IT solutions that cut complexity and risk. (156) |
| Capabilities - Cybersecurity | `/cybersecurity` (was `/capibility-service`) | Cybersecurity Services & Backup for Businesses \| Zios (53) | Endpoint security, firewall, 24/7 monitoring and backup from Zios. Assess your security posture, close gaps and build cyber resilience. Request a consultation. (159) |
| About Us | `/about-us` | About Us: 30+ Years of IT & Cyber Resilience \| Zios (51) | For more than 30 years, Zios has supported companies, municipalities and institutions with reliable IT operations, cybersecurity and AI-driven infrastructure. (158) |
| Our team & careers | `/our-team` | Our Team & Careers: Jobs in IT & Cybersecurity \| Zios (53) | Meet the Zios leadership team led by founder and CEO Daniel Zinner, and explore careers in IT, cybersecurity and AI. Help build secure digital infrastructure. (158) |

Rules followed:
- Titles are at most 60 characters, put the primary keyword first and end with the brand.
- Descriptions are 150–160 characters, carry a value proposition and a call to action, and are unique per page.
- Each page's meta is in the same language as its body copy.
- Open Graph title and description copy the SEO fields.
- Numbers that differ between pages (client counts, device counts) were left out.

## Findings, by priority

### High

1. **Language mismatch.** The site's primary locale is English (`en`), so pages render `<html lang="en">`. Home is in German and targets Austria ("österreichische Unternehmen", "Niederösterreich"). The other four pages are in English and read like template copy. Google ranks pages per language, and a German page marked `en` is a weak signal for Austrian search.
   - Decision needed: if the site is German-first, switch the primary locale to German (de-AT) and translate the four English pages. The meta tags for those pages should then be rewritten in German.
2. **Duplicate H1s.** These look like legacy hidden sections that are still in the DOM. Hidden elements are still crawled.
   - What we do: `wwdhero_heading` and `hero_heading` (both "Rethink what your business can become.").
   - About Us: `abouthero_heading` and `g-hero-heading`.
   - Our team & careers: `teamhero_heading` and `team_hero_heading_title` ("Daniel Zinner").
   - Home and Capabilities have one H1 each.
3. **Hidden legacy sections duplicate content.**
   - About Us has the stats and the timeline twice.
   - What we do has "What we do" and "Core Industries We Serve" twice each.
   - Capabilities has a hidden "What can you do" block containing lorem ipsum.
   - Fix: delete these once confirmed. They were kept per the "hide, don't delete" rule.
4. **Links to drafted pages will break on publish.**
   - The cookie banner links to Privacy&Policy, which is now a draft.
   - Nav, footer and CTA links to Contacts, Cases, Blog, FAQ and Careers need checking in the Designer.
   - Austria (ECG / MedienG / DSGVO) requires an Impressum and a privacy policy on a public business site. Keep or re-enable a privacy page before going live.
5. **Placeholder and repeated copy.**
   - Capabilities: all six "What can I do" panels have the same text.
   - About Us: all four timeline years have the same text.
   - What we do: all five tabs read "Managed IT Services – IT-Betreuung & Outsourcing für Unternehmen".
   - Capabilities stats are in USD and US style ("$1.9 million").
   - Search engines treat this as thin or duplicate content.

### Medium

6. **Inconsistent facts across pages.** Home says 800+ clients, 700+ devices and 2,300+ events/day. About says 650+ clients, 15,000+ devices and 500K+ events/day. Align these; they also feed any future structured data.
7. **Empty links.**
   - The three "Learn More" links in the Home expertise slider point to `href="#"`.
   - The Capabilities "What can I do" tabs are `<a href="#">` used as buttons.
   - Point the slider links to the matching capability page. The tabs should be `<button>` elements.
8. **Copy typos.** Fix these in Figma first, then in Webflow, since the copy has to match Figma.
   - Home slider title and tab: "DSVGO" should be "DSGVO". The Home card above it is already correct.
   - "starten in kürze" should be "in Kürze".
   - "Kunden Vertrauen in Zios" should be "Kunden vertrauen Zios".
   - What we do / About: "Our Driving the Future…" is malformed.
9. **Brand spelling.** "Zios" and "ZiOS" are mixed across pages (alt text, body copy, CTA). Pick one for consistency in brand searches and structured data.
10. **Old slug.** If `/capibility-service` was ever published, add a 301 redirect to `/cybersecurity` (Site settings › Publishing › 301 redirects).
11. **No Open Graph image** on any page. Add a 1200×630 share image (site-wide default plus per page).
12. **Alt text.** Most content images use "inherit from asset", so check the asset-level alt text in the Assets panel. One image on Our team & careers (`2336086f…`) has an empty alt without being marked decorative.

### Low / when going live

13. **Structured data.** Add `Organization` / `LocalBusiness` JSON-LD on Home. It needs the legal name, address, phone and logo, which are not in the repo yet. `Person` for the founder is optional.
14. **Domain.** With no custom domain yet, make sure Site settings › SEO › "Disable Webflow subdomain indexing" is on once a custom domain exists, so the canonical points there.
15. **CMS template pages still publish.** These can't be drafted through the API.
    - Helper collections create thin public URLs: FAQ filters, Key links, Partners logos, Reviews, Cases filters, Key outcomes, Tags, "What can you do", "What you will achieve", Reference collections, Pages, How we help items.
    - Exclude their items from the sitemap and add `noindex` to those templates, or switch off their template pages.
16. **Sitemap.** Draft pages are not published, so they won't appear. Recheck the generated sitemap after the first publish.

## Not covered yet

- Rendered HTML checks (canonical, robots, `hreflang`, heading order after JS) and Lighthouse SEO score: these need network access to the published site.
- Performance audit, then tablet/mobile audit: next steps.
