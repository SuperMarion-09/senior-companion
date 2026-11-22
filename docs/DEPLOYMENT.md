# Deployment guide – Kaagapay (Senior Companion)

How the live site is hosted, how to change it, and how to rebuild it from
scratch. Everything runs on free plans.

**Last verified:** 14 November 2026

---

## 1. What is running where

| Part | Host (plan) | Address | Region |
| ---- | ----------- | ------- | ------ |
| Website (React) | **Vercel** (Hobby, free) – project `senior-companion` | **https://kaagapay-care.vercel.app** | Global CDN |
| API (Laravel) | **Render** (Free web service, Docker) – service `kaagapay-api`, Blueprint `kaagapay` | https://kaagapay-api.onrender.com | Singapore |
| Database (MySQL-compatible) | **TiDB Cloud** (Starter, free, $0 spending limit) – instance `kaagapay`, database `senior_companion` | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000` | AWS Singapore |

All three deploy from the GitHub repository `SuperMarion-09/senior-companion`,
branch **`main`**.

Other address: `senior-companion-sigma.vercel.app` is Vercel's default address
for the same project. Use `kaagapay-care.vercel.app` everywhere (see 5.3).

### How a visit flows

```
Visitor's browser
   │  https://kaagapay-care.vercel.app/...
   ▼
Vercel ──────────── pages, JS, CSS (the React build)
   │  /api/*  and  /sanctum/*  are passed on (frontend/vercel.json)
   ▼
Render: kaagapay-api (Apache + PHP 8.4 + Laravel)
   │  TLS connection
   ▼
TiDB Cloud: senior_companion
```

**Why the API is reached through Vercel.** Admin login uses a Laravel Sanctum
session cookie. Browsers treat `*.vercel.app` and `*.onrender.com` as two
unrelated sites and block cookies between them, so login would fail with
401/419. Because Vercel forwards `/api` and `/sanctum` to Render, the browser
only ever talks to `kaagapay-care.vercel.app`, and the cookie is an ordinary
first-party cookie. That's also why `REACT_APP_API_URL` is the **Vercel**
address, not Render's.

---

## 2. Deployment files in this repository

| File | What it does |
| ---- | ------------ |
| `render.yaml` | Render Blueprint: creates `kaagapay-api` (Docker, free plan, Singapore, health check `/up`) and lists its environment variables. |
| `backend/Dockerfile` | Builds the API image: PHP 8.4 + Apache, `pdo_mysql`, OPcache, production `php.ini`, Composer packages without dev tools. |
| `backend/docker/start.sh` | Runs on every start: caches config and routes, runs `php artisan migrate --force`, starts Apache. |
| `backend/docker/apache.conf` | Serves `backend/public` on Render's `$PORT`; logs go to Render's Logs tab. |
| `backend/docker/php.ini` | Production PHP settings (OPcache on, file checks off). |
| `backend/.dockerignore` | Keeps `.env`, `vendor/`, tests and caches out of the image. |
| `frontend/vercel.json` | Forwards `/api/*` and `/sanctum/*` to Render; sends every other path to `index.html` so React Router pages survive a refresh. |
| `backend/bootstrap/app.php` | `trustProxies(at: '*')`: lets Laravel see HTTPS and the visitor's real IP behind Vercel and Render, so the per-IP rate limits (10 bookings/hour, 5 logins/minute) apply per visitor and not to everyone at once. |

---

## 3. Settings

### 3.1 Vercel – project `senior-companion`

**Settings → Build and Deployment**

| Setting | Value |
| ------- | ----- |
| Root Directory | `frontend` |
| Framework Preset | Create React App (build `npm run build`, output `build`) |
| Production Branch | `main` |

**Settings → Environments → Environment Variables**

| Key | Value | Type | Environments |
| --- | ----- | ---- | ------------ |
| `REACT_APP_API_URL` | `https://kaagapay-care.vercel.app` | **Config** | Production |
| `REACT_APP_USE_MOCK_BOOKINGS` | `false` | Secret | Production and Preview |

- `REACT_APP_*` values are **built into the JavaScript** and visible to anyone.
  Never put a secret in one, and always create them as **Config**, not Secret
  (see 7, "Can't save a REACT_APP_ variable").
- Changing one does nothing until you **redeploy** (Deployments → ⋯ → Redeploy).
- Preview deployments don't get `REACT_APP_API_URL` (it is Production only), so
  they try to reach `localhost`. Add Preview to the variable if you want working
  previews.

**Domains:** `kaagapay-care.vercel.app` (main) and
`senior-companion-sigma.vercel.app`.

### 3.2 Render – service `kaagapay-api`

Values come from `render.yaml`. Fixed values are set in the file; the
`sync: false` ones were typed in when the Blueprint was created and live under
**kaagapay-api → Environment**.

| Key | Value |
| --- | ----- |
| `APP_NAME` | `Kaagapay` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | *secret* – `base64:…`, made with `php artisan key:generate --show` |
| `APP_URL` | `https://kaagapay-care.vercel.app` |
| `FRONTEND_URL` | `https://kaagapay-care.vercel.app` |
| `SANCTUM_STATEFUL_DOMAINS` | `kaagapay-care.vercel.app` (no `https://`) |
| `BUSINESS_TIMEZONE` | `Asia/Manila` |
| `KAAGAPAY_CONTACT_PHONE` / `KAAGAPAY_CONTACT_EMAIL` | shown in emails to families |
| `SESSION_SECURE_COOKIE` | `true` |
| `SESSION_DRIVER` / `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `sync` (no background worker on the free plan) |
| `LOG_CHANNEL` / `LOG_LEVEL` | `stderr` / `info` |
| `DB_CONNECTION` | `mysql` |
| `DB_HOST` | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| `DB_PORT` | `4000` |
| `DB_DATABASE` | `senior_companion` |
| `DB_USERNAME` | TiDB user, `xxxxxxxx.root` |
| `DB_PASSWORD` | *secret* – TiDB password |
| `MYSQL_ATTR_SSL_CA` | `/etc/ssl/certs/ca-certificates.crt` (exactly this; it's the certificate bundle **inside the Linux container**) |
| `MAIL_MAILER` | `brevo` (Brevo's HTTPS API; SMTP is blocked on Render's free plan, see 4.5) |
| `BREVO_API_KEY` | *secret* – Brevo API key, `xkeysib-…` |
| `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | sender verified in Brevo / `Kaagapay` |

Saving a change on the Environment page starts a new deploy.

### 3.3 TiDB Cloud – instance `kaagapay`

- Plan **Starter**, MySQL compatible, AWS **Singapore (ap-southeast-1)**.
- **Monthly spending limit $0**: when the free allowance (5 GiB storage, 50M
  request units a month) runs out, the database is slowed down instead of
  billed.
- Connections must use TLS. TiDB's certificate is signed by a public
  authority, so the system certificate bundle is enough (`MYSQL_ATTR_SSL_CA`).
- The password is shown once when generated. To change it: cluster →
  **Connect → Reset password**, then update `DB_PASSWORD` on Render.

### 3.4 Where the secrets are

| Secret | Stored in | Never in |
| ------ | --------- | -------- |
| TiDB password | Render `DB_PASSWORD`, your password manager | git, screenshots, chat |
| `APP_KEY` | Render `APP_KEY`, your password manager | git |
| Brevo API key | Render `BREVO_API_KEY`, `backend/.env` on your Mac | git, screenshots, chat |
| Admin passwords | TiDB (hashed) | anywhere else |

Changing `APP_KEY` logs everyone out and makes old encrypted values
unreadable – only do it if it leaks.

---

## 4. Everyday tasks

### 4.1 Deploy a change

1. Merge your pull request into `main`.
2. Vercel rebuilds the website (about 1–2 min) and Render rebuilds the API
   (about 2–5 min) automatically.
3. New database migrations run by themselves when the API starts
   (`backend/docker/start.sh`). Write migrations so they're safe to run while
   the old version is still serving.

A failed Render deploy **does not take the site down**: the previous version
keeps running until a deploy succeeds.

### 4.2 Check that everything is up

```bash
curl https://kaagapay-care.vercel.app/api/health
```

Expect `"status":"ok"` and `"database":"connected"`. The first request after
about 15 idle minutes takes up to ~50 seconds while Render wakes the API.

You can also open the site's own status page: https://kaagapay-care.vercel.app/system-status

### 4.3 Create an admin account

There is **no default admin** and no sign-up page, on purpose. Admins are made
with `php artisan admin:create`. Render's free plan has no shell, so run it on
your Mac against the live database:

```bash
cd backend && php artisan config:clear
```

```bash
read -s "DB_PASSWORD?TiDB password: " && export DB_PASSWORD && echo
```

```bash
export DB_CONNECTION=mysql DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com DB_PORT=4000 DB_DATABASE=senior_companion DB_USERNAME=<tidb-user> MYSQL_ATTR_SSL_CA=/etc/ssl/cert.pem
```

```bash
php artisan migrate:status
```

(a list of migrations marked **Ran** means the connection works)

```bash
php artisan admin:create
```

Answer name, email and password (12+ characters, upper and lower case and a
number). Then **always** clean up, or later `php artisan` commands in that
window hit the live database:

```bash
unset DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD MYSQL_ATTR_SSL_CA
```

Notes:

- `/etc/ssl/cert.pem` is the **Mac's** certificate bundle. Render uses
  `/etc/ssl/certs/ca-certificates.crt`. Don't swap them.
- Setting the values with `export` first, then running the command on its
  own, avoids a long command being cut when pasted (which caused the
  "insecure transport" error in 7).

### 4.4 Roll back

- **API:** Render → kaagapay-api → **Deploys** → pick a working deploy →
  **Rollback**.
- **Website:** Vercel → **Deployments** → pick a working deployment → ⋯ →
  **Instant Rollback** (or **Promote to Production**).

Rolling back code does not undo migrations that already ran.

### 4.5 Turn on real emails (Brevo)

Booking status emails go out through **Brevo's HTTPS API** (`MAIL_MAILER=brevo`,
free plan: 300 emails a day). Plain SMTP, Gmail included, **does not work on
Render's free plan**: since September 2025 it blocks outgoing traffic on ports
25, 465 and 587, so SMTP sends time out.

1. Sign up at brevo.com (free plan).
2. **Senders, domains & dedicated IPs → Senders → Add a sender** with the
   address families should see as the sender, and click the link Brevo emails
   to it. A free address like Gmail works, but those emails are more likely to
   land in spam; a verified domain of your own fixes that later.
3. **SMTP & API → API keys → Generate a new API key** (starts with
   `xkeysib-`). Use an *API key*, not the SMTP key.
4. On Render → kaagapay-api → **Environment**, add `BREVO_API_KEY` and
   `MAIL_FROM_ADDRESS` (the verified sender). Save (this redeploys).
   `MAIL_MAILER=brevo` comes from `render.yaml`.
5. Change a test booking's status in the admin and check the inbox. If it
   fails, the admin shows "email failed" (the status change still saves) and
   Render's **Logs** show Brevo's reason.

To test on your Mac, put the same two values in `backend/.env`, set
`MAIL_MAILER=brevo`, and run `php artisan config:clear`.

---

## 5. Rebuilding from scratch

Use this if a service is deleted or you move to new accounts. Order matters:
database → website address → API → website settings → admin.

### 5.1 Database (TiDB Cloud)

1. tidbcloud.com → **Create Resource** → Plan **Starter**, **MySQL
   Compatible**, name `kaagapay`, AWS **Singapore (ap-southeast-1)**, spending
   limit **$0** → Create.
2. When the status is **Active**: **Connect** → Connection type Public, Connect
   With General → **Generate Password** (copy it to your password manager
   immediately) and note host, port `4000` and user (`xxxx.root`).
3. **SQL Editor** → run `CREATE DATABASE senior_companion;`. Tables are created
   later by the API's migrations.

### 5.2 API (Render)

1. On your Mac: `cd backend && php artisan key:generate --show` → copy the
   `base64:…` line.
2. render.com (sign in with GitHub) → **+ New → Blueprint** (not the service
   cards on the welcome page) → repo `senior-companion`, name `kaagapay`,
   branch `main`.
3. Fill in the `sync: false` values from 3.2 → **Deploy Blueprint**.
4. In Logs, wait for the migrations (`… DONE`) and "Your service is live".
5. If the address isn't `kaagapay-api.onrender.com` (name taken), put the real
   address in both rewrites in `frontend/vercel.json` and merge that.

The region (`singapore` in `render.yaml`) can't be changed after the service
exists; to move it, delete and recreate the service.

### 5.3 Website (Vercel)

1. vercel.com → **Add New → Project** → import `senior-companion`.
2. Vercel suggests a multi-service setup ("Services" preset, "Import
   multi-service project"). **Ignore it** and click **Import single project**
   on the `frontend` row, so Root Directory is `frontend` and the preset is
   Create React App.
3. Add `REACT_APP_API_URL` (type **Config**) and `REACT_APP_USE_MOCK_BOOKINGS`
   = `false` → Deploy.
4. **Check the address Vercel actually gave you** (project Overview →
   Domains). If your project name was taken, it adds a suffix (that's how
   `senior-companion-sigma` happened). To get a clean name: **Settings →
   Domains → Add Domain** → e.g. `kaagapay-care.vercel.app`.
5. Set `REACT_APP_API_URL` to that address and **Redeploy**. On Render, set
   `APP_URL`, `FRONTEND_URL` and `SANCTUM_STATEFUL_DOMAINS` to match.
6. Optional: redirect the other `.vercel.app` address to the main one
   (Settings → Domains → Edit → Redirect to Another Domain, 308). Admin login
   only works on the address in `REACT_APP_API_URL`.

### 5.4 Admin and smoke test

1. Create an admin (4.3).
2. Make a booking at `/book` (at least 6 hours ahead, mobile number), look it up
   at `/booking-status`, then log in at `/admin/login` and find it in the
   dashboard.

---

## 6. Free plan limits

| Service | Limit | What happens |
| ------- | ----- | ------------ |
| Render Free | Sleeps after ~15 min without traffic; 512 MB RAM; no shell | First visit after sleep waits ~50 s. Upgrade the instance (from $7/month) to keep it awake. |
| TiDB Starter | 5 GiB storage, 50M request units/month, $0 limit | Slowed down, not billed, if exceeded. Far above what this site needs. |
| Vercel Hobby | Free, **for personal, non-commercial use** | Before using the site for a paying business, move the website to Vercel Pro or to a host whose free plan allows commercial use, and check each provider's current terms. |

Free plan terms change; check each provider's pricing page from time to time.

---

## 7. Troubleshooting

Problems we actually hit while setting this up are marked ★.

| Symptom | Cause | Fix |
| ------- | ----- | ---- |
| ★ Vercel shows "Import multi-service project" and wants a root `vercel.json` | It detected `frontend/` and `backend/` | Click **Import single project** on the `frontend` row. Only the website goes on Vercel. |
| ★ Site is up, but `REACT_APP_API_URL` points at someone else's site | The chosen `.vercel.app` name belonged to another account, so the project got a different address | Always confirm the real domain on the project Overview before using it anywhere. Never send API traffic to an address you don't own. |
| ★ Can't save a `REACT_APP_` variable: "Remove the public framework prefix to keep this value private" | It was created as **Secret**; secrets can't be edited into Config | Delete the variable and add it again with Type **Config**, then redeploy. |
| ★ Website still uses an old value after changing a variable | `REACT_APP_*` values are baked in at build time | Deployments → ⋯ → **Redeploy**. |
| ★ Render deploy fails: `The "/var/www/html/resources/views" directory does not exist` | `view:cache` ran, but the folder is empty and git doesn't store empty folders | Fixed in `start.sh` (no `view:cache`) and the Dockerfile (creates storage folders). Don't add `view:cache` back unless the app gets real Blade views. |
| ★ Render deploy fails: `Cannot connect to MySQL using SSL` / `failed loading cafile stream` | `MYSQL_ATTR_SSL_CA` on Render was changed (text from a Mac command got pasted into it) | Set it back to exactly `/etc/ssl/certs/ca-certificates.crt`. |
| ★ `admin:create` on the Mac: `Connections using insecure transport are prohibited` | `MYSQL_ATTR_SSL_CA` wasn't set in that Terminal | Use the `export` steps in 4.3; check with `php artisan migrate:status`. |
| Login returns 401 or 419 | Address mismatch: site opened on a different address than `REACT_APP_API_URL`, or `SANCTUM_STATEFUL_DOMAINS` doesn't match | Open the site at `kaagapay-care.vercel.app`; make the three Render URL values match it; redeploy both. |
| `/api/...` on the website returns 404 | Render address in `frontend/vercel.json` is wrong, or the API is down | Check `https://kaagapay-api.onrender.com/up`; fix `vercel.json`. |
| Bookings rejected with "too many requests" for everyone | Laravel sees the proxy's IP instead of visitors' | Make sure `trustProxies(at: '*')` is still in `backend/bootstrap/app.php`. |
| Render deploy fails at `migrate` with `Access denied` | Wrong `DB_USERNAME` / `DB_PASSWORD` (often a trailing space) | Re-enter them on Render. The user must include the prefix before `.root`. |
| First page load very slow, then fine | Render free instance was asleep | Normal on the free plan. |
| Frontend build fails mentioning `._` files | macOS junk files from an exFAT drive | `cd frontend && npm run clean:mac`, commit, push. |

---

## 8. Still to do (optional)

- [ ] Redirect `senior-companion-sigma.vercel.app` → `kaagapay-care.vercel.app` (5.3 step 6).
- [ ] Add Preview to `REACT_APP_API_URL` if you want working preview deployments.
- [ ] Turn on Brevo emails (4.5): add `BREVO_API_KEY` and `MAIL_FROM_ADDRESS` on Render.
- [ ] Before commercial launch: review Vercel Hobby's non-commercial terms (6) and consider a custom domain and a paid Render instance.
