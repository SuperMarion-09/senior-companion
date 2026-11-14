#!/usr/bin/env python3
"""
Builds every Kaagapay logo file in branding/logos/ from one set of shapes.

Why a script: the logo shapes and colours live in one place (below), so a
tweak to the mark or a colour only has to be made once. The wordmark and
tagline are converted to outlines (SVG paths) using the website's own fonts,
so the logo files look the same on computers that do not have the fonts.

Run from the repository root:

    pip install fonttools          # one-time, only needed to rebuild
    python3 branding/tools/build_brand_assets.py
    python3 branding/tools/export_png.py   # optional: PNG exports

Fonts are read from frontend/node_modules/@fontsource (run `npm install` in
frontend/ first). Both fonts are SIL Open Font License 1.1.
"""
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / 'frontend' / 'node_modules' / '@fontsource'
OUT = ROOT / 'branding' / 'logos'
SERIF = FONTS / 'source-serif-4' / 'files' / 'source-serif-4-latin-600-normal.woff'
SANS = FONTS / 'atkinson-hyperlegible' / 'files' / 'atkinson-hyperlegible-latin-400-normal.woff'

NAME = 'Kaagapay'
TAGLINE = 'May kasama ka, may kaagapay ka.'

# ---------------------------------------------------------------- Colours
# Keep in step with the palette in 03-brand-guidelines.html and the website
# tokens in frontend/src/index.css.
SAGE = '#4E6E55'        # Kaagapay Sage: primary
CLAY = '#A3502A'        # Warm Clay: secondary
CHARCOAL = '#2E3333'    # text
CREAM = '#FBF8F1'       # background
GOLD = '#F3D9A4'        # Sunlit Gold: highlight
NIGHT = '#1F2A27'       # Night Sage: dark backgrounds
SAGE_LIGHT = '#9DBFA4'  # companion figure on dark backgrounds
CLAY_LIGHT = '#E8956B'  # senior figure on dark backgrounds

# ------------------------------------------------------------ The mark
# "Magkaagapay" (side by side): a companion (left) and a senior (right)
# whose bodies together form a heart. Drawn on a 64 x 64 grid.
COMPANION_HEAD = (21, 11.5, 6.5)
SENIOR_HEAD = (43.5, 12.75, 6)
COMPANION_BODY = 'M31 57C23.5 51.5 9 42.5 9 32C9 26 13.5 21.5 19.5 21.5C24.5 21.5 29 24.5 31 29.5Z'
SENIOR_BODY = 'M33 57C40.5 51.5 55 42.5 55 32C55 26 50.5 21.5 44.5 21.5C39.5 21.5 35 24.5 33 29.5Z'
MARK_BOX = (9, 5, 55, 57)  # visible bounds: x0, y0, x1, y1


def mark(companion, senior, dx=0.0, dy=0.0, scale=1.0, gap=True):
    """The mark as SVG elements, moved by (dx, dy) and scaled.
    gap=False closes the thin gap between the figures, for sizes under
    24px where it would only show as a blur (the two colours still split it)."""
    def circle(c, fill):
        cx, cy, r = c
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/>'

    left, right = COMPANION_BODY, SENIOR_BODY
    if not gap:
        left = left.replace('M31 57', 'M32 57.6').replace('29 24.5 31 29.5Z', '30 24.5 32 30Z')
        right = right.replace('M33 57', 'M32 57.6').replace('35 24.5 33 29.5Z', '34 24.5 32 30Z')
    return (
        f'<g transform="translate({dx:g} {dy:g}) scale({scale:g})">'
        f'{circle(COMPANION_HEAD, companion)}{circle(SENIOR_HEAD, senior)}'
        f'<path d="{left}" fill="{companion}"/>'
        f'<path d="{right}" fill="{senior}"/>'
        '</g>'
    )


# ------------------------------------------------------- Text to outlines
def kerning_pairs(font):
    """Pair kerning from the GPOS 'kern' feature (formats 1 and 2)."""
    pairs = {}
    if 'GPOS' not in font:
        return pairs
    gpos = font['GPOS'].table
    lookup_ids = {i for fr in gpos.FeatureList.FeatureRecord if fr.FeatureTag == 'kern' for i in fr.Feature.LookupListIndex}
    for index in lookup_ids:
        lookup = gpos.LookupList.Lookup[index]
        for sub in lookup.SubTable:
            if lookup.LookupType == 9:
                sub = sub.ExtSubTable
            if getattr(sub, 'Format', None) == 1 and hasattr(sub, 'PairSet'):
                for first, pset in zip(sub.Coverage.glyphs, sub.PairSet):
                    for rec in pset.PairValueRecord:
                        value = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                        pairs.setdefault((first, rec.SecondGlyph), value)
            elif getattr(sub, 'Format', None) == 2 and hasattr(sub, 'Class1Record'):
                class1 = sub.ClassDef1.classDefs
                class2 = sub.ClassDef2.classDefs
                for first in sub.Coverage.glyphs:
                    c1 = class1.get(first, 0)
                    for second, c2 in list(class2.items()) + []:
                        rec = sub.Class1Record[c1].Class2Record[c2]
                        value = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                        if value:
                            pairs.setdefault((first, second), value)
    return pairs


class Outliner:
    def __init__(self, path):
        self.font = TTFont(path)
        self.cmap = self.font.getBestCmap()
        self.glyphs = self.font.getGlyphSet()
        self.upm = self.font['head'].unitsPerEm
        self.kern = kerning_pairs(self.font)
        os2 = self.font['OS/2']
        self.cap_height = getattr(os2, 'sCapHeight', 0) or 0.7 * self.upm
        self.x_height = getattr(os2, 'sxHeight', 0) or 0.5 * self.upm

    def path(self, text, size, x, baseline, tracking=0.0):
        """SVG path data for `text` at font `size`, starting at (x, baseline).
        `tracking` is extra space between letters, in em. Returns (d, width)."""
        scale = size / self.upm
        pen = SVGPathPen(self.glyphs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
        cursor = 0.0
        names = [self.cmap[ord(ch)] for ch in text]
        for i, name in enumerate(names):
            glyph = self.glyphs[name]
            transform = (scale, 0, 0, -scale, x + cursor * scale, baseline)
            glyph.draw(TransformPen(pen, transform))
            cursor += glyph.width
            if i + 1 < len(names):
                cursor += self.kern.get((name, names[i + 1]), 0) + tracking * self.upm
        return pen.getCommands(), cursor * scale


serif = Outliner(SERIF)
sans = Outliner(SANS)


def svg(width, height, body, title, background=None):
    width, height = round(width, 1), round(height, 1)
    bg = f'<rect width="{width:g}" height="{height:g}" fill="{background}"/>' if background else ''
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" '
        f'width="{width:g}" height="{height:g}" role="img" aria-label="{title}">'
        f'<title>{title}</title>{bg}{body}</svg>\n'
    )


def write(name, content):
    (OUT / name).write_text(content)
    print('wrote', (OUT / name).relative_to(ROOT))


# ----------------------------------------------------------- Lockups
MARK_H = MARK_BOX[3] - MARK_BOX[1]  # 52
MARK_W = MARK_BOX[2] - MARK_BOX[0]  # 46
UNIT = 64 / 4                       # clear-space unit "x" = a quarter of the 64 grid


def horizontal(companion, senior, word, tag_colour=None, pad=2):
    """Mark left, wordmark right. With tag_colour, adds the tagline below."""
    cap = 26.0
    size = cap / serif.cap_height * serif.upm
    gap = 14
    word_x = pad + MARK_W + gap
    if tag_colour:
        tag_size = 12.6
        baseline = pad + 29
        word_d, word_w = serif.path(NAME, size, word_x, baseline, tracking=0.005)
        tag_d, tag_w = sans.path(TAGLINE, tag_size, word_x + 1, baseline + 19, tracking=0.01)
        width = word_x + max(word_w, tag_w) + pad
        mark_y = pad + (44 - MARK_H) / 2
        body = mark(companion, senior, pad - MARK_BOX[0], mark_y - MARK_BOX[1] + 2)
        body += f'<path d="{word_d}" fill="{word}"/><path d="{tag_d}" fill="{tag_colour}"/>'
        height = pad * 2 + 52
        return width, height, body
    baseline = pad + MARK_H / 2 + cap / 2
    word_d, word_w = serif.path(NAME, size, word_x, baseline, tracking=0.005)
    width = word_x + word_w + pad
    height = pad * 2 + MARK_H
    body = mark(companion, senior, pad - MARK_BOX[0], pad - MARK_BOX[1])
    body += f'<path d="{word_d}" fill="{word}"/>'
    return width, height, body


def stacked(companion, senior, word, pad=2):
    cap = 22.0
    size = cap / serif.cap_height * serif.upm
    _, word_w = serif.path(NAME, size, 0, 0, tracking=0.01)
    width = max(word_w, MARK_W) + pad * 2
    mark_x = (width - MARK_W) / 2
    baseline = pad + MARK_H + 14 + cap
    word_d, _ = serif.path(NAME, size, (width - word_w) / 2, baseline, tracking=0.01)
    height = baseline + size * 0.26 + pad
    body = mark(companion, senior, mark_x - MARK_BOX[0], pad - MARK_BOX[1])
    body += f'<path d="{word_d}" fill="{word}"/>'
    return width, height, body


def wordmark_only(colour, pad=2):
    cap = 26.0
    size = cap / serif.cap_height * serif.upm
    d, w = serif.path(NAME, size, pad, pad + cap, tracking=0.005)
    return w + pad * 2, pad * 2 + cap + size * 0.26, f'<path d="{d}" fill="{colour}"/>'


def tile(size, radius_ratio, background, companion, senior, mark_ratio=0.62, gap=True):
    """Mark centred on a coloured square (app icon, favicon, avatar)."""
    scale = size * mark_ratio / MARK_H
    dx = (size - MARK_W * scale) / 2 - MARK_BOX[0] * scale
    dy = (size - MARK_H * scale) / 2 - MARK_BOX[1] * scale
    r = size * radius_ratio
    shape = f'<rect width="{size}" height="{size}" rx="{r:g}" fill="{background}"/>'
    return shape + mark(companion, senior, dx, dy, scale, gap)


def circle_tile(size, background, companion, senior, mark_ratio=0.56):
    scale = size * mark_ratio / MARK_H
    dx = (size - MARK_W * scale) / 2 - MARK_BOX[0] * scale
    dy = (size - MARK_H * scale) / 2 - MARK_BOX[1] * scale
    return f'<circle cx="{size / 2}" cy="{size / 2}" r="{size / 2}" fill="{background}"/>' + mark(companion, senior, dx, dy, scale)


# ------------------------------------------------------- Five concepts
# Comparison marks for 01-logo-concepts.html (only concept 1 is developed).
CONCEPTS = {
    'concept-1-magkaagapay': mark(SAGE, CLAY),
    'concept-2-kapit-bisig': (
        f'<circle cx="24" cy="32" r="14" fill="none" stroke="{SAGE}" stroke-width="7"/>'
        f'<circle cx="40" cy="32" r="14" fill="none" stroke="{CLAY}" stroke-width="7"/>'
        f'<path d="M27.62 18.48A14 14 0 0 1 35.47 23.97" fill="none" stroke="{SAGE}" stroke-width="7"/>'
    ),
    'concept-3-tahanan': (
        f'<path d="M10 31L32 12L54 31" fill="none" stroke="{SAGE}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<path d="M32 55C32 55 19 47.5 19 38.5C19 34.5 22 31.5 25.8 31.5C28.6 31.5 31 33.2 32 35.6C33 33.2 35.4 31.5 38.2 31.5'
        f'C42 31.5 45 34.5 45 38.5C45 47.5 32 55 32 55Z" fill="{CLAY}"/>'
    ),
    'concept-4-dahon': (
        f'<path d="M31 56C29 36 36 19 53 11C56 30 48 47 31 56Z" fill="{SAGE}"/>'
        f'<path d="M29 56C20 53 11 44 10 31C21 32 28 41 29 56Z" fill="{CLAY}"/>'
    ),
    'concept-5-k-puso': (
        f'<rect x="12" y="9" width="9" height="46" rx="4.5" fill="{SAGE}"/>'
        f'<path d="M24 33L46 12" stroke="{SAGE}" stroke-width="9" stroke-linecap="round"/>'
        f'<path d="M28 30L48 53" stroke="{SAGE}" stroke-width="9" stroke-linecap="round"/>'
        f'<path d="M40 34.5C40 34.5 34 31 34 26.8C34 25 35.4 23.6 37.1 23.6C38.4 23.6 39.5 24.4 40 25.5'
        f'C40.5 24.4 41.6 23.6 42.9 23.6C44.6 23.6 46 25 46 26.8C46 31 40 34.5 40 34.5Z" fill="{CLAY}"/>'
    ),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'concepts').mkdir(exist_ok=True)

    for name, body in CONCEPTS.items():
        title = name.replace('-', ' ').title()
        write(f'concepts/{name}.svg', svg(64, 64, body, title))
        dark = body.replace(SAGE, SAGE_LIGHT).replace(CLAY, CLAY_LIGHT)
        write(f'concepts/{name}-reversed.svg', svg(64, 64, dark, title))

    # Mark only
    write('kaagapay-mark.svg', svg(64, 64, mark(SAGE, CLAY), 'Kaagapay mark'))
    write('kaagapay-mark-reversed.svg', svg(64, 64, mark(SAGE_LIGHT, CLAY_LIGHT), 'Kaagapay mark, for dark backgrounds'))
    write('kaagapay-mark-charcoal.svg', svg(64, 64, mark(CHARCOAL, CHARCOAL), 'Kaagapay mark, one colour'))
    write('kaagapay-mark-white.svg', svg(64, 64, mark('#FFFFFF', '#FFFFFF'), 'Kaagapay mark, white'))

    # Primary logo: horizontal
    for suffix, colours, label in [
        ('', (SAGE, CLAY, CHARCOAL), 'Kaagapay'),
        ('-reversed', (SAGE_LIGHT, CLAY_LIGHT, CREAM), 'Kaagapay, for dark backgrounds'),
        ('-charcoal', (CHARCOAL, CHARCOAL, CHARCOAL), 'Kaagapay, one colour'),
        ('-white', ('#FFFFFF', '#FFFFFF', '#FFFFFF'), 'Kaagapay, white'),
    ]:
        w, h, body = horizontal(*colours)
        write(f'kaagapay-logo-horizontal{suffix}.svg', svg(w, h, body, label))

    # Logo with tagline
    w, h, body = horizontal(SAGE, CLAY, CHARCOAL, tag_colour='#5A605E')
    write('kaagapay-logo-tagline.svg', svg(w, h, body, f'Kaagapay. {TAGLINE}'))
    w, h, body = horizontal(SAGE_LIGHT, CLAY_LIGHT, CREAM, tag_colour='#C9D3CC')
    write('kaagapay-logo-tagline-reversed.svg', svg(w, h, body, f'Kaagapay. {TAGLINE}'))

    # Secondary logo: stacked
    w, h, body = stacked(SAGE, CLAY, CHARCOAL)
    write('kaagapay-logo-stacked.svg', svg(w, h, body, 'Kaagapay'))
    w, h, body = stacked(SAGE_LIGHT, CLAY_LIGHT, CREAM)
    write('kaagapay-logo-stacked-reversed.svg', svg(w, h, body, 'Kaagapay'))

    # Wordmark only
    w, h, body = wordmark_only(CHARCOAL)
    write('kaagapay-wordmark.svg', svg(w, h, body, 'Kaagapay'))

    # App icon: full-bleed square; iOS and Android apply their own corner mask.
    write('kaagapay-app-icon.svg', svg(1024, 1024, tile(1024, 0, SAGE, CREAM, GOLD, 0.6), 'Kaagapay app icon'))
    # Android adaptive icon layers (108dp canvas, 72dp safe zone = 66%).
    write('kaagapay-android-foreground.svg', svg(432, 432, tile(432, 0, 'none', CREAM, GOLD, 0.40), 'Kaagapay Android icon foreground'))
    write('kaagapay-android-background.svg', svg(432, 432, f'<rect width="432" height="432" fill="{SAGE}"/>', 'Kaagapay Android icon background'))

    # Favicon: rounded tile, readable on light and dark browser tabs. The
    # 16px version uses a slightly bigger mark so the heads stay visible.
    write('favicon.svg', svg(64, 64, tile(64, 0.22, SAGE, CREAM, GOLD, 0.70), 'Kaagapay'))
    write('favicon-16.svg', svg(16, 16, tile(16, 0.2, SAGE, CREAM, GOLD, 0.80, gap=False), 'Kaagapay'))

    # Social profile picture: circle-safe, cream mark on sage.
    write('kaagapay-social-avatar.svg', svg(800, 800, f'<rect width="800" height="800" fill="{SAGE}"/>' + circle_tile(800, SAGE, CREAM, GOLD, 0.5), 'Kaagapay'))


if __name__ == '__main__':
    main()
