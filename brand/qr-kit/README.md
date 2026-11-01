# Valley Feast QR lockup kit

Branded QR codes and print lockups that open the Valley Cookbook. Open `index.html` for the proof sheet (every piece at true relative size, with printing rules).

## What's here

| Lockup | Trim size | Use |
|---|---|---|
| `label` | 40 × 56 mm | Flat face of a bottle or jar |
| `sticker` | 58 mm round | Jar lids, bag seals, takeaway boxes |
| `badge` | 96 × 40 mm | Printed menu, flyer, catering invoice, price card |
| `counter-card` | 105 × 148 mm (A6) | Counter, stall or catering table |
| `code` / `code-mono` | 47.8 × 47.8 mm | The bare code (brand colours / black on white) |

Each comes for three destinations: `cookbook` (recipes.html), `sorrel` (`?recipe=local-sorrel`) and `pepper-sauce` (`?recipe=trini-pepper-sauce`), in three formats:

- `svg/`: vector, text converted to outlines. Send these to the printer.
- `png/`: 600 dpi, transparent outside the artwork.
- `pdf/`: one page cut to the trim size (Chrome rounds page size to within 0.2 mm; use the SVG when exact trim matters).

## How the codes are built

- Error correction **Q** at **version 6** for every code. Version 6 has no alignment pattern in the centre, so the emblem covers data modules only (about 7–8% of them, well inside Q's ~25% recovery).
- Finder eyes are leaf-cut with modest radii. Much rounder eyes stop strict decoders finding the code.
- `build.py` scans every PNG back with zxing-cpp at full size, at about the size of a 25 mm print, blurred and tilted, and fails the build if any file doesn't return its exact URL. OpenCV's detector is printed alongside for information only; it rejects any rounded finder eye, which phone scanners accept.

## Add a product or rebuild

1. Add the recipe to `data/recipes-data.js`.
2. Add one line to `DESTINATIONS` in `build.py` (the build stops if the slug isn't in the recipe data).
3. Run it:

```bash
pip install segno fonttools uharfbuzz zxing-cpp opencv-python pillow
python brand/qr-kit/build.py
```

PNG/PDF export uses a local Chrome, Edge or Playwright Chromium; set `CHROME=<path>` to choose one. Then add the new destination to the `DESTS` list in `index.html`.

Fonts in `fonts/` are Young Serif and Karla under the SIL Open Font License (see the `OFL-*.txt` files).

## Before ordering a print run

Print one proof sheet and scan it with an iPhone camera and an Android camera. Software scanning is not a substitute for a physical proof on the real stock.
