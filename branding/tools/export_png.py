#!/usr/bin/env python3
"""
Exports the PNG (and favicon.ico) versions of the Kaagapay logos and the
social media templates into branding/exports/, using headless Google Chrome.

Run from the repository root after build_brand_assets.py:

    python3 branding/tools/export_png.py

Set CHROME=/path/to/chrome if Chrome is not in the default macOS location.
No Python packages are needed.
"""
import os
import struct
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / 'branding'
LOGOS = BRAND / 'logos'
OUT = BRAND / 'exports'
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

# (source SVG, output PNG, width, height). Height None = keep proportions.
SVG_EXPORTS = [
    ('favicon-16.svg', 'favicon-16.png', 16, 16),
    ('favicon.svg', 'favicon-32.png', 32, 32),
    ('favicon.svg', 'favicon-48.png', 48, 48),
    ('kaagapay-app-icon.svg', 'apple-touch-icon-180.png', 180, 180),
    ('kaagapay-app-icon.svg', 'app-icon-1024.png', 1024, 1024),
    ('kaagapay-app-icon.svg', 'android-icon-512.png', 512, 512),
    ('kaagapay-app-icon.svg', 'android-icon-192.png', 192, 192),
    ('kaagapay-social-avatar.svg', 'social-avatar-800.png', 800, 800),
    ('kaagapay-mark.svg', 'kaagapay-mark@2x.png', 128, 128),
    ('kaagapay-logo-horizontal.svg', 'kaagapay-logo-horizontal@2x.png', 600, None),
    ('kaagapay-logo-horizontal-white.svg', 'kaagapay-logo-horizontal-white@2x.png', 600, None),
    ('kaagapay-logo-horizontal-reversed.svg', 'kaagapay-logo-horizontal-reversed@2x.png', 600, None),
    ('kaagapay-logo-stacked.svg', 'kaagapay-logo-stacked@2x.png', 400, None),
]

# (template HTML, output PNG, width, height)
PAGE_EXPORTS = [
    ('templates/social-post-tagline.html', 'social-post-tagline-1080.png', 1080, 1080),
    ('templates/social-post-service.html', 'social-post-service-1080.png', 1080, 1080),
]


def svg_size(path):
    import re
    head = path.read_text()[:400]
    match = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', head)
    return float(match.group(1)), float(match.group(2))


def screenshot(url, out, width, height, transparent=True):
    args = [
        CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
        '--force-device-scale-factor=1', '--allow-file-access-from-files',
        f'--window-size={width},{height}', f'--screenshot={out}', url,
    ]
    if transparent:
        args.insert(2, '--default-background-color=00000000')
    subprocess.run(args, check=True, capture_output=True)
    print('wrote', out.relative_to(ROOT), f'({width}×{height})')


def write_ico(pngs, out):
    """favicon.ico holding PNG images (supported by every current browser)."""
    data = [p.read_bytes() for p in pngs]
    header = struct.pack('<HHH', 0, 1, len(data))
    offset = 6 + 16 * len(data)
    entries = b''
    for png in data:
        width, height = struct.unpack('>II', png[16:24])
        entries += struct.pack('<BBBBHHII', width % 256, height % 256, 0, 0, 1, 32, len(png), offset)
        offset += len(png)
    out.write_bytes(header + entries + b''.join(data))
    print('wrote', out.relative_to(ROOT))


def main():
    OUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for source, name, width, height in SVG_EXPORTS:
            path = LOGOS / source
            if height is None:
                w, h = svg_size(path)
                height = round(width * h / w)
            wrapper = Path(tmp) / f'{name}.html'
            wrapper.write_text(
                '<!doctype html><html><body style="margin:0;background:transparent">'
                f'<img src="{path.as_uri()}" style="display:block;width:{width}px;height:{height}px">'
                '</body></html>'
            )
            screenshot(wrapper.as_uri(), OUT / name, width, height)

    for source, name, width, height in PAGE_EXPORTS:
        screenshot((BRAND / source).as_uri(), OUT / name, width, height, transparent=False)

    write_ico([OUT / 'favicon-16.png', OUT / 'favicon-32.png', OUT / 'favicon-48.png'], OUT / 'favicon.ico')


if __name__ == '__main__':
    main()
