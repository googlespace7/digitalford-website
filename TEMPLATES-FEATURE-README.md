# Digitalford Templates Feature

## Existing architecture found
The uploaded Digitalford project is a static HTML/CSS/JavaScript website, not a WordPress installation. There is no `wp-content`, theme, plugin, PHP template hierarchy, WordPress database configuration, REST API, or AJAX stack in the source ZIP. The existing contact flow opens WhatsApp from client-side JavaScript.

For that reason, the Templates feature was implemented natively in the existing architecture rather than introducing WordPress or replacing the site.

## Main files
- `templates/index.html` — public Templates page, preview/customizer modal, search/filter interface.
- `assets/js/templates-data.js` — template catalog, categories, tags, fields, features and default content.
- `assets/js/templates.js` — search/filtering, live previews, responsive preview modes, live customizer, image preview uploads, rating logic, choose-template integration and WhatsApp messaging.
- `assets/css/templates.css` — Templates-only styling matched to Digitalford's existing CSS variables and components.
- `assets/images/templates/*.svg` — optimized lazy-loaded template thumbnails.
- `templates/api/rate.php` — optional same-origin PHP rating API with CSRF nonce, validation, file locking, duplicate protection and rate limiting.
- `templates/api/data/ratings.json` — rating storage for PHP-capable hosting.

## Adding or editing templates
Edit `assets/js/templates-data.js`. Categories are generated dynamically from the templates in this file. Add a new object with a unique `id`, name, category, layout, tags, description, features, base rating, theme and fields. Add a matching thumbnail at `assets/images/templates/<id>.svg`.

The current preview renderer contains twelve category-specific layout types: ecommerce, static, freelancer, business, fashion, wellness, restaurant, healthcare, education, realestate, travel and beauty.

## Ratings
Templates start with zero ratings; no demo/customer ratings were fabricated. On PHP-capable same-origin hosting, ratings are stored in `templates/api/data/ratings.json`. The endpoint uses a session nonce, strict 1–5 validation, server-side template validation against the matching thumbnail catalog, file locking, one rating per visitor signature per template per 30 days, and a simple hourly IP rate limit.

On static-only hosting such as GitHub Pages, PHP cannot execute. In that environment the page automatically falls back to localStorage, so a visitor's rating persists on that device/browser but does not become a site-wide shared total. For global ratings on static hosting, connect the client to a serverless/database endpoint or deploy the included PHP endpoint on a PHP-capable host.

## Deployment note
If you want shared global ratings, ensure the server can execute PHP and that `templates/api/data/` is writable by PHP but not publicly readable. The included `.htaccess` denies direct access on Apache. On Nginx, add an equivalent deny rule for that data directory.

## Professional template preview upgrade

The 12 demonstration templates now use fuller, category-specific website layouts rather than simple placeholder blocks. Preview pages include realistic section structures such as product collections, service cards, portfolio projects, menu items, doctors, courses, properties, destinations, salon services, testimonials, stats and conversion CTAs.

Sample photography is loaded from the Pexels image CDN using free-stock photo references. These images are demonstration content only and can be replaced by a visitor through the live customizer where image fields are available. If the remote sample image cannot load, the listing card falls back to the original local SVG preview.

No Digitalford homepage/service-page redesign was performed as part of this upgrade.


## Inline live customization update
- Clicking **Edit Template Live** opens the template itself in editing mode.
- Editable text shows a small pencil control beside the text; changes happen in place.
- Every preview image gets a **Replace image** upload control on the image itself.
- Hero/background images and the logo also have direct upload controls.
- Primary and accent colors are controlled from the floating Live edit toolbar.
- Reset, Done and Choose Template are available from the same in-preview toolbar.
- No separate Elementor-style editing panel is required.

## Sections + pages builder update
- The inline editor now includes **+ Section** and **+ Page** directly in the floating Live edit toolbar.
- Visitors can add multiple sections to any template page. Available sections are category-aware and include About, Services, Products/Menu, Gallery, Testimonials, Stats, Process, FAQs, Contact, CTA and category-specific blocks such as Properties, Destinations, Courses, Treatments and Portfolio.
- Added sections retain the same direct editing experience: text is edited beside the text and images are replaced directly on the image.
- Each added section includes edit-mode controls to move it up, move it down or remove it.
- Visitors can add up to 8 pages per customized template and up to 12 added sections per page.
- Page presets create useful starter section combinations (for example About, Services, Products/Menu, Gallery, FAQ and Contact), while a Custom Page option allows a visitor-defined page name.
- The page selector in the Live edit toolbar switches between Home and added pages. Added pages also appear in the demo site's navigation and footer.
- Added page/section structure and edited text are stored in browser localStorage for that template. Uploaded replacement images remain session-scoped to avoid filling browser storage with large base64 files.
- Reset Changes restores the original single-page template and removes visitor-added pages/sections.
- When a customer chooses a template, the enquiry message includes the names of any pages they added.
