# Kaagapay brand identity

Everything for the Kaagapay logo and brand lives in this folder. The website
uses copies of some of these files (see "On the website" below).

## Look at it

Open the pages through any static web server (the SVG icon sprite does not load
from `file://`):

```bash
python3 -m http.server 4321 --directory branding
```

Then open <http://localhost:4321>.

| Page | What it shows |
| --- | --- |
| `index.html` | Cover page with links to the three steps |
| `01-logo-concepts.html` | Five logo concepts, compared and scored, with the recommendation |
| `02-brand-identity-preview.html` | The recommended logo (Concept 1, *Magkaagapay*) on the website, mobile app, favicon, social media, emails and notifications |
| `03-brand-guidelines.html` | Logo versions, colours with HEX codes, typography, spacing and minimum sizes, do's and don'ts, icons and illustration |

## Folders

```
branding/
├── logos/          SVG logo files (the master artwork)
│   └── concepts/   the five concept marks, for comparison only
├── exports/        PNG and ICO files: favicons, app icons, avatar, email logos, social posts
├── templates/      editable HTML: booking email, email signature, two social posts
├── assets/         styles, fonts (OFL), icon sprite and illustration for the pages above
└── tools/          scripts that rebuild logos/ and exports/
```

## Rebuilding the files

The logo shapes and colours are defined once in `tools/build_brand_assets.py`.
The wordmark is converted to outlines from the website's own font files, so
run `npm install` in `frontend/` first.

```bash
pip install fonttools
python3 branding/tools/build_brand_assets.py   # writes logos/*.svg
python3 branding/tools/export_png.py           # writes exports/*.png and favicon.ico (needs Google Chrome)
```

`export_png.py` also re-exports the social posts from `templates/`, so edit the
text there and run it again to make a new post.

## On the website

The approved logo (Concept 1, *Magkaagapay*) is live on the website:

- `frontend/src/assets/kaagapay-logo.svg` is a copy of
  `logos/kaagapay-logo-horizontal.svg`, shown by
  `frontend/src/components/Brand.js` in the header, footer and admin sidebar.
- `frontend/public/` holds copies of `exports/favicon.ico`, `logos/favicon.svg`,
  `exports/apple-touch-icon-180.png` (as `apple-touch-icon.png`) and
  `exports/android-icon-192.png` / `-512.png` (as `logo192.png` / `logo512.png`).

If you rebuild the logo files, copy them there again.

Not done yet: the booking emails sent by the backend
(`backend/app/Notifications/BookingStatusChanged.php`) still use Laravel's
default email design. `templates/booking-confirmation-email.html` is the
branded design for them; its images must be hosted at full `https://` URLs first.
