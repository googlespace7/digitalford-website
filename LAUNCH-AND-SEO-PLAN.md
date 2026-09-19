# Digitalford website update

## What changed

- All existing page URLs retained; shared navy-and-orange responsive design updated.
- Homepage targets digital marketing in Bhuvanagiri (Bhongir). The district is identified as Yadadri Bhuvanagiri, not treated as another name for the town.
- Ten service pages rewritten with specific scope, useful questions and related service links.
- Existing blog articles retained with updated styling, breadcrumbs and publisher information. They still need an owner-led editorial review for originality, examples and overlapping topics.
- JSON-LD rebuilt using Organization, WebSite, WebPage, BreadcrumbList, Service and BlogPosting where appropriate. No invented address, reviews or star ratings.
- Image dimensions and WebP versions added; external font requests removed.
- Empty social links removed. Add only verified social profile URLs later.
- Enquiry popup is now click-to-open, with Escape, focus return and a keyboard focus trap. WhatsApp forms prepare a message rather than collect submissions on a server.
- Added privacy notice and 404 page; sitemap excludes the blog template and 404 page. Blog template is marked noindex.

## Before uploading

1. Review all business statements, client work and campaign screenshots. Confirm permission to publish client names and screenshots. Existing performance figures are historical examples, not promises; provide dates, objectives and attribution details if available.
2. Confirm the phone number +91 98663 83147, actual service coverage and the privacy notice. No street address or opening hours were invented.
3. Keep a backup of the currently deployed website. Upload the ZIP contents at the site root, not inside an extra directory. Preserve CNAME and .nojekyll for GitHub Pages.
4. No live website or external account was changed by this file update.

## Launch checks

- Verify HTTPS, the custom domain and www/non-www redirects in the hosting dashboard. Canonicals use https://digitalford.in/. Server redirects cannot be configured reliably through HTML alone.
- Verify a nonexistent URL returns HTTP 404 and serves 404.html. Do not return the homepage with HTTP 200 for missing pages.
- Submit https://digitalford.in/sitemap.xml in Google Search Console. Inspect the homepage and priority service URLs; allow time for recrawling.
- Run PageSpeed Insights on the live homepage, a service page and a blog article on mobile. No Core Web Vitals score is claimed for the local package.
- Use Google's Rich Results Test and Schema.org validator. Organization and Service markup do not guarantee a rich result. FAQ markup was not added as a shortcut to visibility.
- Check calls, WhatsApp, mobile navigation, popup dismissal and all external portfolio destinations after deployment.
- Add analytics only after agreeing on privacy/consent requirements. Measure call clicks, WhatsApp clicks and qualified enquiries separately; a click is not a confirmed lead.

## Keyword ownership

| Page | Primary intent |
| --- | --- |
| Homepage | Digital marketing / agency / services in Bhuvanagiri and Bhongir; district context |
| services.html | Overview and comparison of available services |
| seo.html | SEO services in Bhuvanagiri / Bhongir |
| local-seo.html | Local SEO and Google Business Profile support |
| meta-ads.html / google-ads.html | Respective paid advertising services |
| web-design.html | Business website design |
| Other service pages | Their specific service intent |
| Blog articles | Informational questions, not duplicate commercial landing pages |

Do not build separate near-identical Bhuvanagiri and Bhongir pages. Add a district-wide page only if there is genuinely useful coverage, service-delivery information and proof beyond the homepage. Review local-seo-bhuvanagiri.html and local-seo-bhuvanagiri-guide.html for overlap before consolidating; if consolidation is chosen, use a real host-level 301 redirect and update internal links.

## Off-page and local SEO: work outside these files

### First 30 days

- Confirm Google Business Profile eligibility and ownership. Use the real business name, correct category and genuine address or service-area setup. Do not create duplicate town-name profiles or a virtual office listing.
- Standardize the business name, phone and genuine location information across existing profiles.
- Ask real customers for honest reviews without incentives or review gating. Respond helpfully.
- Publish one permission-backed case study with starting conditions, timeframe, work completed and clearly defined outcomes.

### Days 31–60

- Seek relevant links from genuine clients, local business organizations and useful industry resources where editorially appropriate. Avoid bulk directory submissions, paid ranking links and automated comment spam.
- Publish useful local guides based on customer questions. Link them to the relevant service page.
- Add verified social profiles and business contact details consistently; do not invent an office address to target a location.

### Days 61–90

- Review Search Console clicks, impressions, CTR and queries containing Bhuvanagiri, Bhongir and Yadadri. Compare like-for-like periods and account for seasonality.
- Review actual enquiry quality and sales feedback. Improve pages receiving relevant impressions but weak engagement.
- Refresh case studies and consolidate overlapping content only with a deliberate redirect plan.

## SEO, AEO and GEO expectations

Readable answers, clear business identity, crawlable text, accurate markup, useful original evidence and reputable external mentions support discoverability. Google says its AI search features use the same core SEO practices and do not require special AI files or schema. No number-one ranking, featured snippet or AI citation is guaranteed.

Reference: https://developers.google.com/search/docs/appearance/ai-features

## Remaining owner inputs

Verified Google Business Profile and social links; confirmed address/service-area policy; public business email; approved testimonials; permission-backed results with dates; Search Console access; hosting details; analytics preferences.
