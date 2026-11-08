# Senior Companion – Booking System

A booking system for a **non-medical** companionship and chaperone service for
senior citizens (errands, shopping, walking companions, accompaniment to medical
appointments, social visits).

| Part      | Technology                                | Folder      | Runs at                 |
| --------- | ----------------------------------------- | ----------- | ----------------------- |
| Backend   | Laravel 13 (PHP 8.3) – REST API           | `backend/`  | http://localhost:8000   |
| Frontend  | React 19 (Create React App) + Axios       | `frontend/` | http://localhost:3000   |
| Database  | MySQL 8.4                                 | –           | 127.0.0.1:3306          |

> **Why Laravel 13 instead of 11?** Laravel 11 no longer gets security fixes and
> has an unpatched *critical* login-bypass vulnerability, so Composer refuses to
> install it. Laravel 13 has the same folder structure and setup.

The public website is called **Kaagapay** (*"May kasama ka, may kaagapay ka."*).

**Phase 1** set up the foundation: project structure, API, CORS, database,
error handling, admin login and a health check.

**Phase 2 (client-facing website)** adds the public pages families use: the
homepage, a 3-step booking form, the booking confirmation page and a booking
status lookup. The booking API is not built yet, so these pages currently run
in **mock mode** (see section 8c). The admin booking dashboard comes later.

---

## 1. Folder structure

```
senior-companion/
├── .gitignore                  ← files Git must never commit (secrets, dependencies)
├── README.md                   ← this file
│
├── backend/                    ← Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/
│   │   │   │       ├── HealthController.php     ← GET  /api/health
│   │   │   │       └── Admin/AuthController.php ← POST /api/admin/login, GET /api/admin/me, POST /api/admin/logout
│   │   │   ├── Requests/Admin/LoginRequest.php  ← validates the login form
│   │   │   └── Responses/ApiResponse.php        ← builds every JSON response (one standard shape)
│   │   ├── Models/Admin.php                     ← administrator account model
│   │   └── Providers/AppServiceProvider.php     ← login rate limit + password rules
│   ├── bootstrap/app.php        ← routing, Sanctum middleware, API error handling
│   ├── config/
│   │   ├── auth.php             ← logins use the Admin model
│   │   ├── cors.php             ← which websites may call the API
│   │   └── sanctum.php          ← cookie-based login for the React app
│   ├── database/
│   │   ├── migrations/0001_01_01_000000_create_admins_table.php ← admins, sessions, password resets
│   │   └── factories/AdminFactory.php           ← fake admins for tests
│   ├── routes/
│   │   ├── api.php              ← all API endpoints (prefixed with /api)
│   │   ├── web.php              ← GET / (just says "this is the API")
│   │   └── console.php          ← `php artisan admin:create` command
│   ├── tests/Feature/           ← automated tests (health, login, admin command)
│   ├── .env.example             ← template for backend settings (copy to .env)
│   └── .env                     ← your real settings + secrets (NOT committed)
│
└── frontend/                   ← React app
    ├── public/index.html        ← the single HTML page React renders into
    ├── src/
    │   ├── index.js             ← entry point: fonts, router, notifications + auth providers
    │   ├── App.js               ← list of pages (routes)
    │   ├── index.css            ← the design system: colours, text sizes, spacing, all component styles
    │   ├── components/          ← reusable building blocks (see section 8b)
    │   │   ├── Alert, Badge, Brand, Button, ConfirmDialog, EmptyState, Icon, PageHeader, Spinner
    │   │   ├── FormField, FormInput, FormSelect, FormTextarea, FormCheckbox
    │   │   ├── BookingDetails, ContactForm, HeroIllustration, MockModeNotice  ← used by the public pages
    │   │   └── ProtectedRoute.js    ← only lets logged-in admins through
    │   ├── content/
    │   │   └── siteContent.js       ← ALL public website text: services, policies, guidelines, FAQ, contact details
    │   ├── layouts/
    │   │   ├── PublicLayout.js      ← header + navigation / content / footer for public pages
    │   │   └── AdminLayout.js       ← sidebar (desktop) or top bar (mobile) for admin pages
    │   ├── pages/
    │   │   ├── HomePage.js               ← "/"                  – homepage (all sections)
    │   │   ├── BookingPage.js            ← "/book"              – 3-step booking form
    │   │   ├── BookingConfirmationPage.js← "/book/confirmation" – shown after booking
    │   │   ├── BookingStatusPage.js      ← "/booking-status"    – look up a booking
    │   │   ├── SystemStatusPage.js       ← "/system-status"     – checks the connection to Laravel
    │   │   ├── AdminLoginPage.js         ← "/admin/login"       – login form
    │   │   ├── AdminHomePage.js          ← "/admin"             – dashboard (bookings come later)
    │   │   ├── StyleGuidePage.js         ← "/styleguide"        – every component on one page (only during `npm start`)
    │   │   └── NotFoundPage.js           ← any other URL
    │   ├── services/            ← all communication with the API
    │   │   ├── api.js               ← the shared Axios instance + error handling
    │   │   ├── bookingService.js    ← create / look up bookings (mock mode for now, see 8c)
    │   │   ├── contactService.js    ← contact form (mock mode for now)
    │   │   ├── healthService.js
    │   │   └── authService.js
    │   ├── utils/
    │   │   └── booking.js           ← booking form rules (3-hour minimum, phone numbers, dates) + formatting
    │   ├── hooks/
    │   │   ├── useAuth.js           ← who is logged in; login() / logout()
    │   │   ├── useToast.js          ← pop-up notifications: toast.success('Saved.')
    │   │   └── useHealthCheck.js
    │   └── assets/              ← images, fonts, etc. (empty for now)
    ├── .env.example             ← template for frontend settings (copy to .env)
    └── .env                     ← your real settings (NOT committed)
```

---

## 2. Install the tools (one time, macOS)

You need [Homebrew](https://brew.sh). Then run these in **Terminal**:

```bash
brew install php@8.3 composer mysql@8.4
```

Installing Composer also installs the newest PHP (8.5), which Laravel 13 is fine
with, but this project is tested on PHP 8.3. Put PHP 8.3 first on your PATH:

```bash
echo 'export PATH="/opt/homebrew/opt/php@8.3/bin:/opt/homebrew/opt/mysql@8.4/bin:$PATH"' >> ~/.zshrc
```

Close and reopen Terminal, then check:

```bash
php -v        # PHP 8.3.x
composer -V   # Composer 2.x
mysql --version
node -v       # v18 or newer (v20+ recommended)
```

---

## 3. Set up MySQL (one time)

Start the MySQL server:

```bash
brew services start mysql@8.4
```

(This keeps MySQL running in the background, even after a restart. To stop it:
`brew services stop mysql@8.4`.)

Open the MySQL prompt as the `root` user (a fresh Homebrew install has no root password):

```bash
mysql -u root
```

Paste the following, **replacing `choose-a-strong-password`** with your own password:

```sql
CREATE DATABASE senior_companion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'senior_companion'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
CREATE USER 'senior_companion'@'127.0.0.1' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON senior_companion.* TO 'senior_companion'@'localhost';
GRANT ALL PRIVILEGES ON senior_companion.* TO 'senior_companion'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

The app uses its own MySQL user that can only touch its own database. That is
safer than letting it use `root`.

> Optional but recommended: run `mysql_secure_installation` to give `root` a password.

---

## 4. Set up the backend (Laravel)

```bash
cd backend
composer install                 # downloads PHP packages into backend/vendor
cp .env.example .env             # creates your private settings file
php artisan key:generate         # creates a secret encryption key in .env
```

Open `backend/.env` in your editor and set the database password you chose:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=senior_companion
DB_USERNAME=senior_companion
DB_PASSWORD=choose-a-strong-password
```

Create the database tables, then your first administrator account:

```bash
php artisan migrate
php artisan admin:create
```

`admin:create` asks for a name, email and password (at least 12 characters with
upper- and lower-case letters and a number). No default admin or password ever
exists in the code.

---

## 5. Set up the frontend (React)

```bash
cd frontend
npm install                      # downloads JavaScript packages into frontend/node_modules
cp .env.example .env
```

`frontend/.env` contains these settings:

```ini
REACT_APP_API_URL=http://localhost:8000
REACT_APP_USE_MOCK_BOOKINGS=true   # see section 8c
```

> Anything starting with `REACT_APP_` ends up in the public JavaScript. Never put
> passwords or secret keys in `frontend/.env`.

---

## 6. Run the app locally

You need **two Terminal windows** (or tabs), one per app. MySQL must be running.

**Terminal 1 – backend:**

```bash
cd backend
php artisan serve
```

Leave it running. It serves the API at http://localhost:8000.

**Terminal 2 – frontend:**

```bash
cd frontend
npm start
```

Leave it running. It opens http://localhost:3000 in your browser.

Stop either one with `Ctrl + C`.

> Always use **`localhost`** in the browser, not `127.0.0.1`. Login cookies are
> tied to the hostname, so mixing the two breaks login.

---

## 7. Verify that React is connected to Laravel

1. **Backend alone:** open http://localhost:8000/api/health. You should see:

   ```json
   {"success":true,"message":"API is healthy.","data":{"status":"ok","app":"Senior Companion","database":"connected","timestamp":"..."}}
   ```

   Or from Terminal: `curl http://localhost:8000/api/health`

2. **React → Laravel:** open http://localhost:3000/system-status. The *System status* page should
   show a green **Connected** box with *Database: connected*.
   - Stop the backend (`Ctrl + C` in Terminal 1) and click **Check again**: you get
     a red *"Cannot reach the server"* message. Start it again and it turns green.

3. **Admin login:** click **Administrator login**, sign in with the account you
   made with `php artisan admin:create`. You land on `/admin` with
   *"You are logged in as …"*. Refresh the page: you stay logged in. Click
   **Log out** and you're sent back to the login page.

4. **Automated tests:**

   ```bash
   cd backend && php artisan test
   cd frontend && CI=true npm test
   ```

---

## 8. API conventions

All endpoints live under `/api` and always answer with JSON in one of two shapes:

```jsonc
// Success
{ "success": true,  "message": "Logged in successfully.", "data": { ... } }

// Error
{ "success": false, "message": "These credentials do not match our records.",
  "errors": { "email": ["These credentials do not match our records."] } }  // "errors" only for form validation
```

| Status | Meaning                                   |
| ------ | ----------------------------------------- |
| 200    | OK                                        |
| 401    | Not logged in                             |
| 403    | Logged in but not allowed                 |
| 404    | Not found                                 |
| 419    | Session/CSRF token expired – refresh page |
| 422    | Validation failed (see `errors`)          |
| 429    | Too many attempts (login: 5 per minute)   |
| 500    | Server error (details only in `backend/storage/logs/laravel.log`) |
| 503    | API running but database unreachable      |

| Method | Endpoint             | Login needed | Purpose                      |
| ------ | -------------------- | ------------ | ---------------------------- |
| GET    | `/api/health`        | No           | Is the API + database up?    |
| POST   | `/api/admin/login`   | No           | Log in (`email`, `password`) |
| GET    | `/api/admin/me`      | Yes          | Current admin's details      |
| POST   | `/api/admin/logout`  | Yes          | Log out                      |

In React, always call the API through `src/services/` (which uses the shared
Axios instance in `src/services/api.js`). Errors arrive as an `ApiError` with
`error.message` (show it to the user) and `error.errors` (per-field messages).

### How admin login works (Laravel Sanctum, cookie-based)

1. React calls `GET /sanctum/csrf-cookie`. Laravel sets an `XSRF-TOKEN` cookie.
2. React posts the email/password to `/api/admin/login`. Axios copies the token
   into an `X-XSRF-TOKEN` header automatically (CSRF protection).
3. Laravel checks the password and starts a session. The session cookie is
   `HttpOnly`, so JavaScript can't read it, which protects it from XSS.
4. Every later request sends the cookie automatically (`withCredentials: true`).

The settings that make this work are in `backend/.env`:
`FRONTEND_URL` (CORS) and `SANCTUM_STATEFUL_DOMAINS`.

---

## 8b. Design system (frontend)

Every page uses the same look, defined once in `frontend/src/index.css` and the
components in `frontend/src/components/`. While `npm start` is running, open
**http://localhost:3000/styleguide** to see all of them on one page.

- **Colours, text sizes, spacing, corners and shadows** are CSS variables at the
  top of `index.css` (`--color-primary`, `--text-lg`, `--space-4`, …). Use them
  instead of typing colour codes or pixel sizes.
- **Fonts:** *Atkinson Hyperlegible* for text (designed for readers with low
  vision) and *Source Serif 4* for headings. Both are bundled with the app via
  `@fontsource`, so no request goes to Google.
- **Accessibility rules:** body text 18px, colour contrast at least WCAG AA,
  click targets at least 44px tall, visible orange focus outline, every icon
  next to a text label, "Skip to main content" link, and animations switched
  off for people who ask their system for reduced motion.
- **Which component for which message:**

  | Situation | Use |
  | --------- | --- |
  | Form field is wrong | `error` prop on `FormInput` / `FormSelect` / `FormTextarea` |
  | Whole form failed, or a page-level message | `<Alert type="error">` |
  | Something finished (saved, logged out) | `toast.success('…')` from `useToast()` |
  | Waiting for the API | `<Spinner>` or `isLoading` on the `Button` |
  | A list has nothing in it | `<EmptyState>` |
  | Action that can't be undone | `<ConfirmDialog>` |

---

## 8c. Public website and booking (Phase 2)

| Page | Address | What it does |
| ---- | ------- | ------------ |
| Homepage | `/` | Hero, About, Services, How it works, Why Kaagapay, Service guidelines, Booking policies, FAQ, Contact. The navigation links jump to these sections (`/#services`, `/#guidelines`, …). |
| Booking form | `/book` | 3 steps: client details → service details → review and agree. `/book?service=walking` pre-selects a service (used by the homepage service cards). |
| Confirmation | `/book/confirmation` | Reference number (e.g. `KGP-7H3K9Q`), the booking details and status *Pending Confirmation*. |
| Booking status | `/booking-status` | Shows one booking when **both** the reference number and the contact number match. |

**To change any wording** (services, policies, guidelines, FAQ, phone number,
email), edit `frontend/src/content/siteContent.js`. The contact details there
are placeholders (`+63 900 000 0000`, `hello@kaagapay.example`) until you put
in the real ones.

**The hero picture** is an SVG illustration (`components/HeroIllustration.js`).
Replace it with a real photo of Kaagapay companions and clients, taken with
their written consent, when you have one.

### Mock mode (until the booking API exists)

The Laravel booking endpoints are not built yet. While
`REACT_APP_USE_MOCK_BOOKINGS` is not `false`:

- bookings are saved in the visitor's **own browser** (localStorage) only, so
  you can try the whole flow (book → confirmation → check status);
- the contact form does not send anything;
- a blue **"Preview mode"** notice is shown on the booking, status and contact
  forms, so nobody thinks a real request was sent.

**Connecting the real API:** build these endpoints in Laravel, then set
`REACT_APP_USE_MOCK_BOOKINGS=false` in `frontend/.env` and restart `npm start`.
The exact request and response shapes are documented at the top of
`frontend/src/services/bookingService.js`.

| Method | Endpoint | Body | Returns |
| ------ | -------- | ---- | ------- |
| POST | `/api/bookings` | the form in snake_case (`client_name`, `contact_number`, `service_type`, `booking_date`, `start_time`, `duration_hours`, …) | 201 + the booking, status `pending` |
| POST | `/api/bookings/lookup` | `reference`, `contact_number` | 200 + the booking, or 404 |
| POST | `/api/contact-messages` | `name`, `contact_number`, `email`, `message` | 201 |

Privacy rules for `/api/bookings/lookup`, which **must be enforced in Laravel**
(the browser can be bypassed):

- return a booking only when the reference **and** the phone number match, and
  only these fields: reference, client name, service, date, start time,
  duration, status (never phone numbers or addresses);
- give the same 404 message whether the reference or the phone number is wrong;
- rate-limit it (like the admin login) so references cannot be guessed.

The backend must also re-check every booking rule the form checks (minimum 3
hours, date not in the past, all agreements ticked, valid phone numbers): see
`frontend/src/utils/booking.js`.

---

## 9. Troubleshooting

| Problem | Fix |
| ------- | --- |
| Status page says *Cannot reach the server* | Is `php artisan serve` running? Is `REACT_APP_API_URL` correct? Restart `npm start` after editing `frontend/.env`. |
| `/api/health` returns 503 | MySQL isn't running (`brew services start mysql@8.4`) or `DB_*` values in `backend/.env` are wrong. |
| Browser console shows a **CORS** error | `FRONTEND_URL` in `backend/.env` must exactly match the React address (`http://localhost:3000`). Then run `php artisan config:clear` and restart `php artisan serve`. |
| Login returns **419** | Use `localhost` everywhere (not `127.0.0.1`), and check `SANCTUM_STATEFUL_DOMAINS=localhost:3000`. |
| `php -v` shows 8.5 | The PATH line from step 2 isn't active. Reopen Terminal. |
| `npm start` / `npm test` / build shows strange errors mentioning files starting with `._` | See below. |

### Project on an external drive (exFAT / FAT)

If the project is on a drive formatted as exFAT or FAT (common for USB drives),
macOS creates hidden `._filename` files next to real files. They hold no code,
but they can break ESLint and Jest. Remove them with:

```bash
cd frontend && npm run clean:mac
```

The permanent fix is to keep the project on your Mac's internal disk (or an
APFS-formatted drive).
