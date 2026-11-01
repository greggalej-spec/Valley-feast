"""
Valley Feast — QR lockup kit builder.

Builds branded QR codes and print lockups for every destination below, as
outlined vector SVG (no fonts needed at the printer), 600 dpi PNG and
exact-size PDF, then scans every PNG back to prove it decodes.

    pip install segno fonttools uharfbuzz zxing-cpp opencv-python pillow
    python brand/qr-kit/build.py

PNG/PDF export drives a local Chromium (Chrome, Edge or a Playwright build);
set CHROME=<path> to pick one. Add a product by adding a line to DESTINATIONS.
"""
import math, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

import segno
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

KIT = Path(__file__).resolve().parent
REPO = KIT.parents[1]
SITE = "https://www.valleyfeastkitchen.com/recipes.html"

# slug "" = the whole cookbook. Recipe slugs must exist in data/recipes-data.js.
DESTINATIONS = [
    {"slug": "",                   "file": "cookbook",    "title": "The Valley Cookbook", "cta": "Scan for recipes",    "ring": "THE VALLEY COOKBOOK"},
    {"slug": "local-sorrel",       "file": "sorrel",      "title": "Local Sorrel",        "cta": "Scan for the recipe", "ring": "LOCAL SORREL"},
    {"slug": "trini-pepper-sauce", "file": "pepper-sauce","title": "Trini Pepper Sauce",  "cta": "Scan for the recipe", "ring": "TRINI PEPPER SAUCE"},
]

# sRGB equivalents of the OKLCH tokens in assets/css/tokens.css; LOGO_GREEN is the logo itself.
LOGO_GREEN = "#2a4a32"
GREEN_INK  = "#0d2816"
GREEN_MID  = "#396344"
CREAM      = "#f8f7f0"
ON_GREEN   = "#ebe9d8"
SPICE_DEEP = "#b55422"
GOLD       = "#e6be68"

QR_VERSION, QR_ERROR = 6, "q"   # v6 has no centre alignment pattern, so the emblem covers data only
QUIET = 4                        # modules of clear space, per the QR spec


def url_for(d):
    return f"{SITE}?recipe={d['slug']}" if d["slug"] else SITE


def n(v):
    return f"{v:.3f}".rstrip("0").rstrip(".")


# ---------------------------------------------------------------- type → outlines
class Face:
    def __init__(self, path, wght=None):
        self.blob = hb.Blob.from_file_path(str(path))
        self.font = hb.Font(hb.Face(self.blob))
        self.tt = TTFont(path)
        self.upem = self.tt["head"].unitsPerEm
        self.order = self.tt.getGlyphOrder()
        loc = {"wght": wght} if wght else None
        if wght:
            self.font.set_variations(loc)
        self.gs = self.tt.getGlyphSet(location=loc)

    def shape(self, text, size, track=0.0):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.font, buf, {"kern": True, "liga": False})
        s = size / self.upem
        out, x = [], 0.0
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            adv = pos.x_advance * s
            out.append((self.order[info.codepoint], x + pos.x_offset * s, adv))
            x += adv + track
        return out, x - track

    def glyph(self, name, size, x, y):
        pen = SVGPathPen(self.gs, ntos=n)
        s = size / self.upem
        self.gs[name].draw(TransformPen(pen, (s, 0, 0, -s, x, y)))
        return pen.getCommands()

    def text(self, text, size, x, y, anchor="start", track=0.0):
        glyphs, w = self.shape(text, size, track)
        x0 = x - {"start": 0, "middle": w / 2, "end": w}[anchor]
        return "".join(self.glyph(g, size, x0 + gx, y) for g, gx, _ in glyphs)

    def width(self, text, size, track=0.0):
        return self.shape(text, size, track)[1]

    def fit(self, text, size, max_w, track=0.0):
        w = self.width(text, size, track)
        return size if w <= max_w else size * max_w / w

    def ring(self, text, size, cx, cy, r):
        """Text set clockwise around a circle, spaced to close the loop evenly."""
        glyphs, w = self.shape(text, size)
        gap = (2 * math.pi * r - w) / len(glyphs)
        out, s = [], 0.0
        for g, _, adv in glyphs:
            deg = math.degrees((s + adv / 2) / r)
            d = self.glyph(g, size, -adv / 2, 0)
            if d:
                out.append(f'<path transform="translate({n(cx)} {n(cy)}) rotate({n(deg)}) translate(0 {n(-r)})" d="{d}"/>')
            s += adv + gap
        return "".join(out)


FONTS = KIT / "fonts"
SERIF = Face(FONTS / "YoungSerif-Regular.ttf")
SANS_BOLD = Face(FONTS / "Karla-VF.ttf", wght=700)
SANS_SEMI = Face(FONTS / "Karla-VF.ttf", wght=600)


# ---------------------------------------------------------------- the emblem
def emblem(color, bold=False, rings=True):
    """The logo mark from index.html in a 0..100 box. bold = the heavier badge cut for small sizes."""
    w = (lambda thin, heavy: heavy if bold else thin)
    ring = (f'<circle cx="50" cy="50" r="46" stroke-width="2"/><circle cx="50" cy="50" r="42.5" stroke-width="2"/>'
            if rings else "")
    return (
        f'<g fill="none" stroke="{color}" stroke-linecap="round" stroke-linejoin="round">{ring}'
        f'<path d="M9.5 60.5 L23 45 L32.5 33 L38 39.5 L52.5 19.5 L63 38 L69 32 L90.5 55" stroke-width="{w(2.1, 4)}"/>'
        f'<path d="M45 33 l3.5 3.5 l3.5 -3.5 l3.5 3.5 l3.5 -3.5" stroke-width="{w(1.8, 3.4)}"/>'
        + ("" if bold else '<path d="M29 38.5 l2.6 2.6 l2.6 -2.6" stroke-width="1.6"/>') +
        f'<path d="M8.5 62.5 C 26 58, 46 63, 62 74 M91.5 62.5 C 74 58, 54 63, 38 74" stroke-width="{w(2.1, 4)}"/>'
        f'<g transform="translate(48 66) rotate(-42)"><ellipse cx="0" cy="-17" rx="7.8" ry="10.6" stroke-width="{w(2.6, 4.6)}"/>'
        f'<path d="M0 -6.4 V 26.5" stroke-width="{w(2.8, 4.8)}"/></g>'
        f'<g transform="translate(52.5 66) rotate(42)"><path d="M0 -5 L-7.4 -14.5 M0 -5 L7.4 -14.5" stroke-width="{w(2.3, 4.2)}"/>'
        f'<path d="M-7.4 -14.5 L-9.4 -25 M-2.5 -16 L-3.1 -27.5 M2.5 -16 L3.1 -27.5 M7.4 -14.5 L9.4 -25" stroke-width="{w(2.1, 3.8)}"/>'
        f'<path d="M0 -5 V 26.5" stroke-width="{w(2.8, 4.8)}"/></g></g>'
    )


def place(inner, x, y, size, box=100):
    return f'<g transform="translate({n(x)} {n(y)}) scale({n(size / box)})">{inner}</g>'


# ---------------------------------------------------------------- the code
def rrect(x, y, w, h, tl, tr, br, bl):
    """Rounded rect with a radius per corner, wound clockwise."""
    return (f"M{n(x + tl)} {n(y)}H{n(x + w - tr)}A{n(tr)} {n(tr)} 0 0 1 {n(x + w)} {n(y + tr)}"
            f"V{n(y + h - br)}A{n(br)} {n(br)} 0 0 1 {n(x + w - br)} {n(y + h)}"
            f"H{n(x + bl)}A{n(bl)} {n(bl)} 0 0 1 {n(x)} {n(y + h - bl)}"
            f"V{n(y + tl)}A{n(tl)} {n(tl)} 0 0 1 {n(x + tl)} {n(y)}Z")


def leaf(x, y, size, big, small, point):
    """A seed/leaf shape: rounded everywhere except the corner that points at the code's centre."""
    r = {"tl": big, "tr": big, "br": big, "bl": big}
    r[point] = small
    return rrect(x, y, size, size, r["tl"], r["tr"], r["br"], r["bl"])


def make_qr(url):
    qr = segno.make(url, error=QR_ERROR, version=QR_VERSION, micro=False, boost_error=False)
    m = [list(row) for row in qr.matrix]
    return qr, m


def qr_svg(url, size, x=0.0, y=0.0, dark=LOGO_GREEN, light=CREAM, logo=True):
    """The styled symbol, `size` mm wide WITHOUT its quiet zone, top-left at (x, y).
    Returns (svg, stats). Callers must leave QUIET modules of `light` around it."""
    qr, m = make_qr(url)
    N = len(m)
    u = size / N
    finders = {"tl": (0, 0, "br"), "tr": (N - 7, 0, "bl"), "bl": (0, N - 7, "tr")}

    def in_finder(r, c):
        return (r < 8 and c < 8) or (r < 8 and c >= N - 8) or (r >= N - 8 and c < 8)

    centre = N / 2
    hole = N * 0.13 if logo else 0           # emblem disc radius, in modules
    def knocked(r, c):
        return logo and math.hypot(c + 0.5 - centre, r + 0.5 - centre) < hole + 0.5

    dark_total = sum(1 for r in range(N) for c in range(N) if m[r][c] and not in_finder(r, c))
    lost = sum(1 for r in range(N) for c in range(N) if m[r][c] and not in_finder(r, c) and knocked(r, c))

    def on(r, c):
        return 0 <= r < N and 0 <= c < N and m[r][c] and not in_finder(r, c) and not knocked(r, c)

    k = 0.46                                  # dot radius; neighbours join into pills
    d = []
    for r in range(N):
        for c in range(N):
            if not on(r, c):
                continue
            cx, cy = c + 0.5, r + 0.5
            d.append(f"M{n(cx - k)} {n(cy)}a{k} {k} 0 1 1 {n(2 * k)} 0a{k} {k} 0 1 1 {n(-2 * k)} 0Z")
            if on(r, c + 1):
                d.append(f"M{n(cx)} {n(cy - k)}h1v{n(2 * k)}h-1Z")
            if on(r + 1, c):
                d.append(f"M{n(cx - k)} {n(cy)}h{n(2 * k)}v1h{n(-2 * k)}Z")
            if on(r, c + 1) and on(r + 1, c) and on(r + 1, c + 1):
                d.append(f"M{n(cx)} {n(cy)}h1v1h-1Z")   # fill the pinhole inside a 2x2 block

    eyes = []
    for fx, fy, point in finders.values():
        # radii stay modest: much rounder eyes stop strict decoders finding the code at all
        outer = leaf(fx, fy, 7, 1.6, 0.4, point)
        inner = leaf(fx + 1, fy + 1, 5, 1.05, 0.2, point)
        eyes.append(f'<path fill-rule="evenodd" d="{outer}{inner}"/>')
        eyes.append(f'<path d="{leaf(fx + 2, fy + 2, 3, 0.75, 0.15, point)}"/>')

    centre_mark = ""
    if logo:
        R = hole - 0.15
        centre_mark = (f'<circle cx="{n(centre)}" cy="{n(centre)}" r="{n(R)}" fill="none" stroke="{dark}" stroke-width="0.32"/>'
                       + place(emblem(dark, bold=True, rings=False), centre - R * 0.86, centre - R * 0.86, R * 1.72))

    svg = (f'<g transform="translate({n(x)} {n(y)}) scale({n(u)})" fill="{dark}">'
           f'<path d="{"".join(d)}"/>{"".join(eyes)}{centre_mark}</g>')
    return svg, {"modules": N, "module_mm": u, "covered_pct": 100 * lost / dark_total, "version": qr.designator}


# ---------------------------------------------------------------- lockups (all units mm)
def doc(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{n(w)}mm" height="{n(h)}mm" viewBox="0 0 {n(w)} {n(h)}">'
            f"<title>{title}</title>{body}</svg>\n")


def code_only(d, mono=False):
    dark, light = ("#000000", "#ffffff") if mono else (LOGO_GREEN, CREAM)
    size = 40.0
    q = size / 41 * QUIET
    code, stats = qr_svg(url_for(d), size, q, q, dark=dark, light=light)
    W = size + 2 * q
    return doc(W, W, f'<rect width="{n(W)}" height="{n(W)}" fill="{light}"/>{code}', f"Valley Feast QR — {d['title']}"), stats


def label(d):
    W, H = 40.0, 56.0
    size = 30.0
    code, _ = qr_svg(url_for(d), size, 5, 5)
    title_size = SERIF.fit(d["title"], 4.6, 33)
    body = (
        f'<rect width="{W}" height="{H}" rx="3" fill="{CREAM}"/>'
        f'<rect x="1.2" y="1.2" width="{W - 2.4}" height="{H - 2.4}" rx="2.2" fill="none" stroke="{LOGO_GREEN}" stroke-width="0.3"/>'
        f"{code}"
        f'<path fill="{SPICE_DEEP}" d="{SANS_BOLD.text(d["cta"].upper(), 2.35, W / 2, 40.6, "middle", 0.42)}"/>'
        f'<path fill="{LOGO_GREEN}" d="{SERIF.text(d["title"], title_size, W / 2, 46.4, "middle")}"/>'
        f'<path d="M14 49.3H26" stroke="{GOLD}" stroke-width="0.35" stroke-linecap="round"/>'
        f'<path fill="{GREEN_MID}" d="{SANS_SEMI.text("VALLEY FEAST · MARACAS VALLEY", 1.75, W / 2, 52.4, "middle", 0.3)}"/>'
    )
    return doc(W, H, body, f"Valley Feast recipe label — {d['title']}")


def badge(d):
    W, H, split = 96.0, 40.0, 56.0
    code, _ = qr_svg(url_for(d), 30, split + 5, 5)
    title_size = SERIF.fit(d["title"], 4.6, 44)
    arrow_x = 6 + SANS_SEMI.width(d["cta"], 2.5) + 1.6
    body = (
        f'<rect width="{W}" height="{H}" rx="3" fill="{CREAM}"/>'
        f'<path d="{rrect(0, 0, split, H, 3, 0, 0, 3)}" fill="{LOGO_GREEN}"/>'
        + place(emblem(ON_GREEN), 6, 5.5, 13) +
        f'<path fill="{ON_GREEN}" d="{SERIF.text("Valley Feast", 5.1, 22.5, 12.4)}"/>'
        f'<path fill="{GOLD}" d="{SANS_BOLD.text("KITCHEN & CATERING", 1.75, 22.6, 16.2, track=0.42)}"/>'
        f'<path d="M6 22.5H50" stroke="{GOLD}" stroke-width="0.3" stroke-dasharray="0.6 1.1" stroke-linecap="round"/>'
        f'<path fill="{ON_GREEN}" d="{SERIF.text(d["title"], title_size, 6, 30)}"/>'
        f'<path fill="{GOLD}" d="{SANS_SEMI.text(d["cta"], 2.5, 6, 35.2)}"/>'
        f'<path d="M{n(arrow_x)} 34.4h4.2m-1.5 -1.4l1.5 1.4l-1.5 1.4" fill="none" stroke="{GOLD}" stroke-width="0.4" stroke-linecap="round" stroke-linejoin="round"/>'
        f"{code}"
    )
    return doc(W, H, body, f"Valley Feast QR badge — {d['title']}")


def sticker(d):
    D = 58.0
    c = D / 2
    inner = 22.6
    size = 2 * inner / math.sqrt(2) * 41 / (41 + 2 * 3)   # code + 3 modules of clear space fit the cream disc
    code, _ = qr_svg(url_for(d), size, c - size / 2, c - size / 2)
    text = f'{d["ring"]}  ·  SCAN FOR THE RECIPE  ·  VALLEY FEAST  ·  '
    body = (
        f'<circle cx="{c}" cy="{c}" r="{c}" fill="{LOGO_GREEN}"/>'
        f'<circle cx="{c}" cy="{c}" r="{c - 1.3}" fill="none" stroke="{GOLD}" stroke-width="0.25" stroke-dasharray="0.5 1"/>'
        f'<g fill="{GOLD}">{SANS_BOLD.ring(text, 2.45, c, c, c - 4.3)}</g>'
        f'<circle cx="{c}" cy="{c}" r="{inner}" fill="{CREAM}"/>'
        f"{code}"
    )
    return doc(D, D, body, f"Valley Feast round sticker — {d['title']}")


def counter_card(d):
    W, H = 105.0, 148.0
    size = 50.0
    code, _ = qr_svg(url_for(d), size, (W - size) / 2, 67)
    title_size = SERIF.fit(d["title"], 6, 80)
    body = (
        f'<rect width="{W}" height="{H}" fill="{CREAM}"/>'
        f'<rect width="{W}" height="58" fill="{LOGO_GREEN}"/>'
        + place(emblem(ON_GREEN), (W - 15) / 2, 7, 15) +
        f'<path fill="{GOLD}" d="{SANS_BOLD.text("VALLEY FEAST · THE COOKBOOK", 2.3, W / 2, 30.5, "middle", 0.55)}"/>'
        f'<path fill="{ON_GREEN}" d="{SERIF.text("From our valley,", 7.4, W / 2, 41, "middle")}"/>'
        f'<path fill="{ON_GREEN}" d="{SERIF.text("to your kitchen.", 7.4, W / 2, 50, "middle")}"/>'
        f'<path fill="{SPICE_DEEP}" d="{SANS_BOLD.text(d["cta"].upper(), 2.9, W / 2, 127.5, "middle", 0.55)}"/>'
        f'<path fill="{LOGO_GREEN}" d="{SERIF.text(d["title"], title_size, W / 2, 135.5, "middle")}"/>'
        f'<path fill="{GREEN_MID}" d="{SANS_SEMI.text("valleyfeastkitchen.com/recipes.html", 2.5, W / 2, 142, "middle")}"/>'
        f"{code}"
    )
    return doc(W, H, body, f"Valley Feast counter card — {d['title']}")


LOCKUPS = {
    "code":         lambda d: code_only(d)[0],
    "code-mono":    lambda d: code_only(d, mono=True)[0],
    "label":        label,
    "badge":        badge,
    "sticker":      sticker,
    "counter-card": counter_card,
}


# ---------------------------------------------------------------- export + proof
def find_chrome():
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    home = Path.home()
    candidates = [
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        *sorted((home / "AppData/Local/ms-playwright").glob("chromium-*/chrome-win64/chrome.exe"), reverse=True),
        Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    for name in ("google-chrome", "chromium", "chromium-browser"):
        if shutil.which(name):
            return shutil.which(name)
    sys.exit("No Chromium found; set CHROME=<path to chrome/edge>.")


def export(svg_path, png_path, pdf_path, chrome, dpi=600):
    from PIL import Image
    m = re.search(r'width="([\d.]+)mm" height="([\d.]+)mm"', svg_path.read_text(encoding="utf-8"))
    w_mm, h_mm = float(m.group(1)), float(m.group(2))
    css_w, css_h = math.ceil(w_mm * 96 / 25.4), math.ceil(h_mm * 96 / 25.4)
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "page.html"
        page.write_text(
            f"<!doctype html><meta charset=utf-8><style>@page{{size:{w_mm}mm {h_mm}mm;margin:0}}"
            f"html,body{{margin:0;background:transparent}}img{{display:block;width:{w_mm}mm;height:{h_mm}mm}}</style>"
            f'<img src="{svg_path.resolve().as_uri()}">', encoding="utf-8")
        common = [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                  f"--user-data-dir={tmp}/profile"]
        shot = Path(tmp) / "shot.png"
        subprocess.run(common + [f"--force-device-scale-factor={dpi / 96}", f"--window-size={css_w + 40},{css_h + 40}",
                                 "--default-background-color=00000000", f"--screenshot={shot}", page.as_uri()],
                       check=True, capture_output=True)
        px_w, px_h = round(w_mm / 25.4 * dpi), round(h_mm / 25.4 * dpi)
        Image.open(shot).crop((0, 0, px_w, px_h)).save(png_path, dpi=(dpi, dpi), optimize=True)
        subprocess.run(common + ["--no-pdf-header-footer", f"--print-to-pdf={pdf_path}", page.as_uri()],
                       check=True, capture_output=True)


SCAN_CASES = {
    "full": dict(scale=1.0),
    "25%": dict(scale=0.25),
    "12%": dict(scale=0.12),                       # ~25 mm code seen at phone-camera resolution
    "blur": dict(scale=0.2, blur=1.2),             # ~0.25 module of camera softness
    "tilt": dict(scale=0.25, rotate=9),
}


def decodes(png_path, expected):
    """zxing-cpp (the engine family behind most Android scanners) must read the URL in every
    case. OpenCV's detector is stricter than any phone about round finder eyes, so it is
    reported for information only."""
    import cv2, numpy as np, zxingcpp
    from PIL import Image
    rgba = Image.open(png_path).convert("RGBA")
    flat = Image.new("RGB", rgba.size, "white")
    flat.paste(rgba, mask=rgba.split()[3])          # transparent sticker corners → white paper
    base = np.array(flat)
    zx, cv = {}, {}
    for name, case in SCAN_CASES.items():
        im = cv2.resize(base, None, fx=case["scale"], fy=case["scale"], interpolation=cv2.INTER_AREA)
        if case.get("blur"):
            im = cv2.GaussianBlur(im, (0, 0), case["blur"])
        if case.get("rotate"):
            pad = max(im.shape[:2]) // 3          # room to turn without cropping an edge-placed code
            im = cv2.copyMakeBorder(im, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(255, 255, 255))
            h, w = im.shape[:2]
            M = cv2.getRotationMatrix2D((w / 2, h / 2), case["rotate"], 1.0)
            im = cv2.warpAffine(im, M, (w, h), borderValue=(255, 255, 255))
        zx[name] = any(b.text == expected for b in zxingcpp.read_barcodes(im))
        cv[name] = cv2.QRCodeDetector().detectAndDecode(im)[0] == expected
    return zx, cv


def main():
    recipes = (REPO / "data/recipes-data.js").read_text(encoding="utf-8")
    slugs = set(re.findall(r'slug:\s*"([^"]+)"', recipes))
    for d in DESTINATIONS:
        if d["slug"] and d["slug"] not in slugs:
            sys.exit(f"Recipe slug '{d['slug']}' is not in data/recipes-data.js")

    chrome = find_chrome()
    for sub in ("svg", "png", "pdf"):
        (KIT / sub).mkdir(exist_ok=True)

    failures = []
    for d in DESTINATIONS:
        _, stats = code_only(d)
        print(f"{d['file']:<13} {stats['version']}  {stats['modules']} modules  "
              f"emblem covers {stats['covered_pct']:.1f}% of data modules  -> {url_for(d)}")
        for kind, build in LOCKUPS.items():
            name = f"vf-{kind}-{d['file']}"
            svg = KIT / "svg" / f"{name}.svg"
            svg.write_text(build(d), encoding="utf-8")
            png, pdf = KIT / "png" / f"{name}.png", KIT / "pdf" / f"{name}.pdf"
            export(svg, png, pdf, chrome)
            zx, cv = decodes(png, url_for(d))
            flag = "ok  " if all(zx.values()) else "FAIL"
            marks = lambda r: "".join("y" if v else "." for v in r.values())
            print(f"   {flag} {name:<34} zxing {marks(zx)}  opencv {marks(cv)}   ({' '.join(SCAN_CASES)})")
            if not all(zx.values()):
                failures.append(name)
    if failures:
        sys.exit(f"Scan check failed: {failures}")
    print("All lockups scan back to their URL.")


if __name__ == "__main__":
    main()
