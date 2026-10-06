# Digitalford AI Website Builder

## Added page
- `ai-website-builder.html`

## User flow
Business details → Products/services → Audience → Website goals → Brand/style → Generate → Preview → Customize → Publish/Discuss with Digitalford

## AI generation
The page has two modes:
1. **Server AI mode** — `api/ai-generate.php` securely calls the OpenAI Responses API from the server. The API key is never exposed to browser JavaScript.
2. **Smart local preview fallback** — if PHP/API configuration is unavailable, the page still generates a category-aware website concept locally so the customer can complete the flow and preview/customize a concept.

### Server environment variables
Set these on the server, not in HTML/JavaScript:
- `OPENAI_API_KEY` — required for live AI generation
- `OPENAI_MODEL` — optional; defaults to `gpt-5.6-luna`

The endpoint includes session nonce validation, input size limits, sanitization, structured output, per-session limiting and hashed-IP rate limiting.

## Publishing
The generated concept is a preview. The **Publish Website** action sends the business/category/goals/sections summary to Digitalford on the existing WhatsApp number so final development, domain setup and production publishing can be completed after confirmation.

## Static hosting limitation
GitHub Pages and other static-only hosting cannot execute PHP. On static hosting the page automatically uses the local preview generator. To enable live AI generation, host `api/ai-generate.php` on a PHP-capable backend (or replace it with an equivalent secure serverless endpoint) and keep the AI key server-side.

## Files added
- `ai-website-builder.html`
- `assets/css/ai-builder.css`
- `assets/js/ai-builder.js`
- `api/ai-generate.php`
- `api/data/.htaccess`
- `api/data/index.html`
- `api/data/ai-rate.json`
- `AI-WEBSITE-BUILDER-README.md`
- `AI-WEBSITE-BUILDER-QA-REPORT.txt`

## Existing files changed
- Main navigation on existing HTML pages: added **AI Builder** after Templates.
- `sitemap.xml`: added the AI Website Builder URL.

No existing service content, template functionality, blog content, colors, analytics or URLs were redesigned or removed.

## Fully Editable Generated Website (Visual Editor Update)

After a website concept is generated, the AI Website Builder now opens in visual editing mode. The generated website is no longer limited to a few sidebar fields.

Editable/customizable areas include:
- Inline text editing throughout the generated website
- Business name, page headings, paragraphs, CTA labels, product/service content, FAQ content, contact details and footer copy
- Logo, hero, product/service, about and gallery image replacement directly in the preview
- Add, remove, duplicate and reorder sections
- Add, remove, duplicate items/cards inside compatible sections
- Section background and layout switching
- Add, rename, switch and remove pages
- Add common sections: products/services, about, gallery, testimonials, statistics, process, FAQ, text, contact, CTA and hero
- Global primary/accent/background/text colors
- Font family, button shape, corner radius, section spacing and content width
- Global contact information
- SEO title and meta description
- Undo, redo and reset-to-generated controls
- Desktop, tablet and mobile preview modes
- Draft saving in the browser

Image uploads are stored in the current browser draft when storage capacity allows. Large image-heavy drafts may be saved as text/layout only because browser localStorage has a size limit.

## 2026 automatic-content update

The separate manual Products & Services onboarding step has been removed. The builder now uses the business name, business type, category, location and natural-language business description to infer relevant products/services, editable sample prices, category-matched realistic images and a starter logo. Audience, goals and branding are optional. The generated site remains fully editable in the visual editor.

## Regenerate Website / Alternative Versions

The generated-site workspace now includes a prominent **Generate Another Design** option. It is available from the main result toolbar, the visual editor toolbar, and the regeneration prompt below the result header.

Users can choose between:

- **Fresh Website Version** — reuses the same business details and generates a new content/design direction. When the server-side AI endpoint is configured, the regeneration request explicitly asks for a meaningfully different alternative. In local/static fallback mode, copy and visual layout variations are generated without an external API.
- **New Design, Same Content** — keeps the current pages, products, services, text and contact details, while changing the visual direction, section layouts, spacing, imagery and styling.

Before regeneration, the current website is temporarily preserved. A **Restore Previous** control appears after regeneration so users can compare the new version with the previous one and switch back if preferred.

## Commerce & Customer Experience Extension

Generated websites now include a lightweight customer-facing commerce/enquiry prototype:

- Services can display an **Enquiry Now** action that prepares a WhatsApp enquiry using the generated site's WhatsApp/phone setting.
- Product cards can display **Buy Now**, **Add to Cart**, and **Save for later** actions.
- The generated header includes **Cart**, **Saved items**, and a **Customer Account** entry.
- Cart quantities, saved items, preview customer profile, and preview order history persist in browser localStorage for the generated business preview.
- Buy Now / cart checkout creates an order request summary and can continue to the business on WhatsApp.
- A generated-site floating WhatsApp button is shown when a WhatsApp/phone number is configured.
- Instagram, Facebook, YouTube, and LinkedIn URLs can be added from Site Settings and appear in the generated footer.
- The visual editor now includes separate **Products + Cart** and **Services + Enquiry** section presets.

Important: this is a functional builder preview. It does not process payments and the customer account is browser-local. Production authentication, shared order storage, inventory, taxes, shipping, payment gateway integration, transactional email/SMS, and server-side order management require a production backend before launch.
