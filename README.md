# Valley Feast Kitchen Delight

Website + staff studio for Valley Feast — authentic Trinidadian kitchen & catering in Maracas, St. Joseph.

**No build step.** Plain HTML/CSS/JS — open `index.html` or host the folder anywhere (GitHub Pages works as-is).

## Pages

| Page | What it is |
|---|---|
| `index.html` | Landing — hero, signature dishes, story, catering teaser, hours & contact |
| `menu.html` | Full menu, rendered live from the data layer, with category nav + dietary filters |
| `catering.html` | Catering services + quote request (sends via WhatsApp or email) |
| `recipes.html` | **The Valley Cookbook** — searchable recipes, ingredient scaling, printable recipe views and catering links |
| `admin/index.html` | **Staff studio** — menu manager, flyer studio, printed menu, invoices, settings |

## Recipes and packaging QR codes

Recipe content lives in `data/recipes-data.js`. Add a new object there to publish another recipe; the collection, filters, detail view, ingredient scaling and search-engine recipe data are rendered automatically.

Three print-ready 900 × 900 PNG QR codes are in `assets/img/`:

| File | Destination | Best use |
|---|---|---|
| `recipes-qr.png` | `https://www.valleyfeastkitchen.com/recipes.html` | General Valley Feast / mixed-product label |
| `recipes-qr-sorrel.png` | `https://www.valleyfeastkitchen.com/recipes.html?recipe=local-sorrel` | Sorrel packaging |
| `recipes-qr-pepper-sauce.png` | `https://www.valleyfeastkitchen.com/recipes.html?recipe=trini-pepper-sauce` | Pepper or pepper-sauce packaging |

Keep a clear, empty border around the code. Print it at least 25 mm (1 inch) wide, preferably 30–35 mm, and scan a physical proof on both iPhone and Android before ordering labels. The dark-green-on-cream artwork uses high error correction, but avoid glossy glare, folds, curved seams or placing text over the code.

The Sorrel and pepper-sauce images were generated specifically for this project. Existing imagery in `assets/img/` is also described in the repository as AI-generated.

## How the data works

- `data/menu-data.js` is the **published** menu database (items, categories, business settings).
- The staff studio edits a working copy in the browser's localStorage — changes show on the public pages *on that device* instantly.
- **Publish changes** in the studio downloads a fresh `menu-data.js`. Replace `data/menu-data.js` with it and push — now everyone sees it.

## Staff studio

- **Menu manager** — add/edit/delete dishes, drag to reorder, toggle on/off the menu, manage categories.
- **Flyer studio** — branded daily-special flyers (WhatsApp 4:5, Post 1:1, Story 9:16), three palettes, real PNG download.
- **Printed menu** — print-ready A4 menu built from live listings (print → save as PDF).
- **Invoices** — branded catering invoices with auto-numbering, saved locally, printable.
- **Settings** — phone, WhatsApp, email, address, hours, socials used across the site and documents.

## Brand

- Logo: mountains + crossed spoon & fork emblem (vectorized as inline SVG throughout).
- Colors: forest green `#2a4a32`, parchment cream, burnt-orange spice accents (OKLCH tokens in `assets/css/tokens.css`).
- Type: Young Serif (display) + Karla (UI/body), via Google Fonts.
- Photography: AI-generated dish imagery in `assets/img/`.
