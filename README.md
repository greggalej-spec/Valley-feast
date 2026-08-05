# Valley Feast Kitchen Delight

Website + staff studio for Valley Feast — authentic Trinidadian kitchen & catering in Maracas, St. Joseph.

**No build step.** Plain HTML/CSS/JS — open `index.html` or host the folder anywhere (GitHub Pages works as-is).

## Pages

| Page | What it is |
|---|---|
| `index.html` | Landing — hero, signature dishes, story, catering teaser, hours & contact |
| `menu.html` | Full menu, rendered live from the data layer, with category nav + dietary filters |
| `catering.html` | Catering services + quote request (sends via WhatsApp or email) |
| `admin/index.html` | **Staff studio** — menu manager, flyer studio, printed menu, invoices, settings |

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
