# Email templates

Every email Kaagapay sends to families uses one design system: the same header,
footer, colours, buttons and tone, built so it reads well for older readers and
works in Gmail, Outlook, Apple Mail, Yahoo and phone mail apps.

- **22 templates** in four groups (account, bookings and payments, companions
  and visits, notices and news), each with realistic sample data.
- **Shared components** (`<x-email.button>`, `<x-email.details>`, …) so a
  template only says *what* to show, never *how*.
- **A preview page** for admins (`/admin/emails`) and a raw preview for
  developers (`/email-previews`).
- **Plain-text versions** made automatically from the HTML.

No new libraries were added: it is plain Laravel Blade, Mailables and the
existing React admin.

---

## 1. Where things live

```
backend/
├── app/Mail/
│   ├── KaagapayMail.php                 ← the one Mailable that sends any template
│   └── Templates/
│       ├── EmailTemplates.php           ← the list of templates: name, subject, variables
│       ├── EmailRenderer.php            ← fills in data, renders HTML + plain text
│       ├── EmailTheme.php               ← colours, fonts, tones, status labels
│       ├── SampleData.php               ← sample data and test scenarios per template
│       ├── BookingEmailData.php         ← Booking model → template variables
│       ├── HtmlToText.php               ← builds the plain-text part
│       ├── EmailTemplate.php, RenderedEmail.php
├── resources/views/
│   ├── emails/layouts/base.blade.php    ← the frame: <head>, header, card, signature, footer
│   ├── emails/partials/                 ← booking-details, need-help (shared blocks)
│   ├── emails/templates/{key}.blade.php ← one file per email: CONTENT ONLY
│   └── components/email/                ← the building blocks (see section 3)
├── app/Http/Controllers/Api/Admin/EmailTemplateController.php ← preview API
├── routes/web.php                       ← /email-previews (local only)
├── routes/console.php                   ← php artisan email:test
└── tests/Feature/EmailTemplatesTest.php
frontend/
├── public/email/                        ← logo PNGs the emails load (hosted by the website)
├── src/pages/AdminEmailTemplatesPage.js ← /admin/emails
└── src/components/EmailPreviewFrame.js
```

**Content and design are separate.** A template file only contains words and
components. All table markup, inline styles, Outlook fixes and mobile rules
live in the layout and the components. To change wording, edit
`emails/templates/{key}.blade.php`. To change a colour everywhere, edit
`EmailTheme.php`.

---

## 2. The templates

| Group | Key | Sent when | Wired up today? |
| ----- | --- | --------- | --------------- |
| Account and sign-in | `welcome` | A family registers | Needs family accounts |
| | `email-verification` | After registering / changing email | Needs family accounts |
| | `password-reset` | Someone asks to reset a password | Needs family accounts |
| | `password-changed` | A password was changed | Needs family accounts |
| Bookings and payments | `booking-confirmation` | Admin enters a booking and confirms it straight away | **Yes** (admin new booking, if ticked) |
| | `booking-request-received` | The booking form is sent, or an admin enters a pending booking | **Yes** (always from the website; admin if ticked) |
| | `booking-approved` | Admin confirms a booking | **Yes** (`BookingStatusChanged`) |
| | `booking-rejected` | Admin rejects a booking | **Yes** (`BookingStatusChanged`) |
| | `booking-reminder` | 5:00 PM the day before a confirmed visit | **Yes** (`bookings:send-reminders`, needs the scheduler) |
| | `booking-cancellation` | Admin cancels a booking | **Yes** (`BookingStatusChanged`) |
| | `booking-rescheduled` | Admin moves a confirmed booking to another date or time | **Yes** (edit form, if ticked) |
| | `payment-confirmation` | Payment succeeded | Needs payments |
| | `payment-failed` | Payment failed | Needs payments |
| Companions and visits | `companion-assigned` | A companion is matched | Needs companion records |
| | `companion-profile-update` | Companion details change | Needs companion records |
| | `companion-on-the-way` | Companion starts travelling | Needs tracking / companion app |
| | `service-completed` | Admin marks a booking completed | **Yes** (`BookingStatusChanged`) |
| | `feedback-request` | A day or two after a visit | Needs a feedback page |
| Notices and news | `account-update` | Account details changed | Needs family accounts |
| | `support-request-received` | Contact form sent | Needs `POST /api/contact-messages` |
| | `general-announcement` | The team sends news | Ready (send manually) |
| | `promotional` | Offers (with unsubscribe) | Needs an opt-in list and unsubscribe page |

"Ready" means everything it needs already exists in the app. The others depend
on features the platform does not have yet (family accounts, payments,
companion profiles, a feedback page); the emails are designed and tested so
they are ready when those arrive (section 7 shows how to send one).

The full list of variables for each template, with descriptions, is in
`EmailTemplates.php` and on the **Sample data** tab of the preview page.

### Variables

Templates use the variable names you would expect, e.g. `{{customer_name}}`:

| In subjects and preview text | In Blade templates |
| --------------------------- | ------------------ |
| `{{customer_name}}` | `{{ $customer_name }}` |
| `{{senior_name\|your loved one}}` (with a fallback) | `{{ $senior_name ?: 'your loved one' }}` |

Common ones: `customer_name` (the person reading: the family contact),
`senior_name`, `companion_name`, `booking_reference`, `service_name`,
`booking_date`, `booking_time`, `booking_duration`, `booking_location`,
`booking_destination`, `booking_status`, `booking_url`, `total_amount`,
`payment_reference`, `verification_link`, `reset_password_link`.

Always available, from `config/kaagapay.php`: `platform_name`,
`support_email`, `support_phone`, `website_url`, and the whole `$brand` array
in Blade.

**Pass values already formatted** for families: `"Saturday, 28 November 2026"`,
`"8:00 AM"`, `"₱1,950.00"`. `BookingEmailData::from($booking)` does this for
bookings.

**Required vs optional.** Rendering stops with a clear error if a required
variable is missing (better than sending "Hello ,"). Optional variables may be
left out or empty: every row, box or button that uses one hides itself.

**`booking_status`** accepts `pending`, `confirmed`, `rescheduled`,
`completed`, `cancelled` and `rejected`, shown to families as "Waiting for
confirmation", "Confirmed", "Rescheduled", "Completed", "Cancelled" and
"Not available" (see `EmailTheme::STATUSES`).

---

## 3. Components

Every component is one row of the email card, so templates are just a list of
them. They live in `backend/resources/views/components/email/`.

| Component | Use it for |
| --------- | ---------- |
| `<x-email.hero icon="🎉" badge="…" tone="success">Headline</x-email.hero>` | Top of every email. Use `:status="$booking_status"` instead of `badge` for a booking status. |
| `<x-email.lead>…</x-email.lead>` | The greeting and first paragraph. |
| `<x-email.text muted small center>…</x-email.text>` | Any other paragraph. |
| `<x-email.heading>What happens next</x-email.heading>` | A section title. |
| `<x-email.button :href="$url">View my booking</x-email.button>` | The main action. `variant="secondary"` for an outline button, `fallback` to also print the link (security emails), `center`. Hidden if `href` is empty. |
| `<x-email.link :href="$url">Book again</x-email.link>` | A quieter text-link action. |
| `<x-email.details title="…" :reference="$booking_reference">` + `<x-email.detail label="Date" :value="$booking_date" />` | Label/value panels. Empty rows hide. `:previous` shows an old value crossed out; `total` for amounts; `mono` for codes. |
| `@include('emails.partials.booking-details', ['title' => 'Your visit'])` | The standard booking summary. |
| `<x-email.callout tone="warning" icon="📞" title="…">…</x-email.callout>` | An important note. Tones: `info`, `success`, `warning`, `danger`, `clay`, `neutral`. |
| `<x-email.steps :steps="[['title' => …, 'text' => …]]" />` | Numbered "how it works" steps. |
| `<x-email.checklist :items="[…]" />` / `<x-email.bullets :items="[…]" />` | Lists. |
| `<x-email.companion :name="…" :photo="…" :bio="…" :facts="[…]" />` | Companion introduction (initials if no photo). |
| `<x-email.quote :author="…">…</x-email.quote>` | A personal note (admin, companion). |
| `<x-email.rating :url="$feedback_url" />` | One-tap 1–5 rating (adds `?rating=N`). |
| `<x-email.code :code="…" label="…" />` | Verification or promo code. |
| `<x-email.divider />`, `<x-email.pill>`, `<x-email.status>` | Small pieces. |

The header, footer and signature are added by the layout. Hide the signature in
a template with `@section('hide_signature', true)`.

### Design rules the components follow

- Body text 17–18px, headings in Source Serif 4 (falls back to Georgia),
  body in Atkinson Hyperlegible (falls back to Segoe UI / Helvetica / Arial).
- Every colour pair meets WCAG AA contrast; colours come from the brand
  guidelines (`branding/03-brand-guidelines.html`).
- Buttons are at least 50px tall and full width on phones.
- Icons are decorative emoji next to text, never the only way to understand something.
- One main button per email. Warm, plain words: "View my booking", not "Click here".
- Always: a way to reach a real person, and "In an emergency, always call 911 first."

---

## 4. Add a new template

Example: a "Visit starts in one hour" message.

1. **Describe it** in `backend/app/Mail/Templates/EmailTemplates.php`:

   ```php
   new EmailTemplate(
       key: 'visit-starting-soon',
       name: 'Visit starting soon',
       category: self::CATEGORY_COMPANION,
       description: 'A short heads-up one hour before the visit.',
       trigger: 'One hour before a confirmed visit.',
       subject: '{{companion_name|Your companion}} arrives at {{booking_time}}',
       preheader: 'A quick reminder for {{senior_name|your loved one}}\'s visit today.',
       required: ['customer_name' => 'Reader\'s name', 'booking_time' => 'Start time'],
       optional: self::booking('booking_time') + ['companion_name' => 'Companion\'s name'],
   ),
   ```

2. **Write the content** in `backend/resources/views/emails/templates/visit-starting-soon.blade.php`:

   ```blade
   @extends('emails.layouts.base')

   @section('content')
       <x-email.hero icon="⏰" badge="Today" tone="clay">See you at {{ $booking_time }}</x-email.hero>
       <x-email.lead>Hello {{ $customer_name }}, {{ $companion_name ?: 'your companion' }} will arrive in about an hour.</x-email.lead>
       @include('emails.partials.booking-details', ['title' => 'Today\'s visit'])
       <x-email.button :href="$booking_url">View my booking</x-email.button>
       @include('emails.partials.need-help')
   @endsection
   ```

3. **Add sample data** in `SampleData::defaults()` (and extra scenarios in
   `extraScenarios()` if useful).

4. **Check it**: open `/admin/emails` (or `http://localhost:8000/email-previews/visit-starting-soon`),
   try the phone view and the "Only required details" scenario, then run
   `php artisan test --filter=EmailTemplatesTest`. The tests render every
   template in every scenario and fail on unfilled `{{…}}`, empty links or a
   size that Gmail would cut off. Update the expected count (22) in the test.

## 5. Change an existing template

| To change… | Edit |
| ---------- | ---- |
| Wording of one email | `resources/views/emails/templates/{key}.blade.php` |
| Subject or inbox preview text | `subject:` / `preheader:` in `EmailTemplates.php` |
| A colour or font everywhere | `app/Mail/Templates/EmailTheme.php` |
| How a button / panel looks everywhere | `resources/views/components/email/*.blade.php` |
| Header, footer, signature | `components/email/header.blade.php`, `footer.blade.php`, `signature.blade.php` |
| Phone number, email, hours, links | `.env`: `KAAGAPAY_CONTACT_PHONE`, `KAAGAPAY_CONTACT_EMAIL`, `KAAGAPAY_SUPPORT_HOURS`, `KAAGAPAY_PRIVACY_URL`, `KAAGAPAY_TERMS_URL`, `KAAGAPAY_ADDRESS` (see `config/kaagapay.php`) |
| Logo | Replace the PNGs in `frontend/public/email/` (copies of `branding/exports/`) |

Rules for email-safe changes:

- Use the components; do not add `<div>` layouts, flexbox, grid, `<style>`
  classes or JavaScript in templates. Mail apps ignore most of it.
- Inline styles only, inside components. Outlook on Windows ignores
  `border-radius`, shadows and padding on links; the components already
  handle that.
- Images need a full `https://` address, a `width` and an `alt` text.
- Escape everything: use `{{ }}` (never `{!! !!}`) for data that came from
  people.

---

## 6. Preview and test

**Admin preview: `/admin/emails`** (any logged-in admin, also on the live site)

- Browse all 22 templates by group, or search.
- Switch between **Desktop** and **Phone** width.
- Choose a **sample scenario** ("Everything filled in", "Only required
  details", and template-specific ones like "Cancelled by Kaagapay").
- Change the **booking status** to see how the badge and wording adapt.
- Edit any **sample value** and watch the email update (only for the preview).
- **Links and checks** tab: size, subject length, every link and where it goes,
  alt text, unsubscribe.
- **Plain text** tab: the text-only version.
- The inbox row shows the sender name, subject and preview text as a mail app would.

Nothing is sent from this page. It is backed by:

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| GET | `/api/admin/email-templates` | Templates, variables, scenarios, statuses |
| POST | `/api/admin/email-templates/{key}/preview` | `scenario`, `booking_status`, `data` → `subject`, `preheader`, `html`, `text` |

**Developer preview: `http://localhost:8000/email-previews`** (only when
`APP_ENV=local`, or `EMAIL_PREVIEWS=true`). The exact HTML that is sent, to
open in a browser or paste into Litmus / Email on Acid. Add `?scenario=minimal`,
`?status=pending` or `?format=text`.

**Send yourself a real one** to check Gmail, Outlook and Apple Mail:

```bash
cd backend && php artisan email:test booking-approved you@example.com
```

```bash
cd backend && php artisan email:test booking-reminder you@example.com --scenario=today
```

It uses whatever `MAIL_MAILER` is set in `backend/.env` (with `log`, the
email is written to `storage/logs/laravel.log` instead).

**Automated tests:** `php artisan test --filter=EmailTemplatesTest`.

### Email app compatibility

| Technique | Why |
| --------- | --- |
| Table layout, 600px column, MSO "ghost table" | Outlook on Windows uses Word to draw emails |
| All styles inline | Gmail and Outlook strip most `<style>` rules |
| `<style>` only for phones (`max-width: 620px`) | Stacks label/value rows, full-width buttons. Clients that ignore it still get a readable 600px fluid layout |
| Bulletproof buttons (`mso-padding-alt`) | Buttons keep their size in Outlook |
| Hidden preheader + spacer characters | Controls the inbox preview text |
| `color-scheme: light` | Stops Apple Mail and Outlook.com from inverting the brand colours |
| Absolute `https://` images with `alt`, `width`, `height` | Images blocked by default still leave readable text |
| Plain-text part, `Reply-To` support address | Better delivery; replies reach a person |
| `List-Unsubscribe` + one-click header (marketing only) | Required by Gmail and Yahoo for bulk mail |

Before going live with a new design, send it with `email:test` to a Gmail,
an Outlook.com and an iPhone address and look at each on a phone and a computer.

---

## 7. Connecting templates to the backend

### What sends what today

| Trigger | Code | Template |
| ------- | ---- | -------- |
| Family sends the booking form | `Api\BookingController::store()` | `booking-request-received` |
| Admin enters a booking (`notify_client: true`) | `Api\Admin\BookingController::store()` | `booking-request-received`, or `booking-confirmation` when `confirm` is true |
| Admin edits a **confirmed** booking's date or start time (`notify_client: true`) | `Api\Admin\BookingController::update()` | `booking-rescheduled`, with the old date and/or time |
| Admin confirms / rejects / cancels / completes (`notify_client: true`) | `BookingStatusService` → `BookingStatusChanged` | `booking-approved`, `booking-rejected`, `booking-cancellation`, `service-completed` |
| Daily at 5:00 PM Philippine time | `bookings:send-reminders` in `routes/console.php` | `booking-reminder` for confirmed visits tomorrow |

Every one of them follows the same rules:

- Only sent when the booking has a valid email address.
- Only sent **after** the change is saved. A mail problem is reported to the
  log and never undoes or blocks the booking (`App\Services\BookingMailer`
  catches it; `BookingStatusService` does the same for status emails).
- The result (`sent` / `failed`) is stored on the booking's activity timeline,
  so admins can see whether the family was emailed. The admin also gets a
  message: "The family has been emailed." or "…please call them instead."

What the admin types in the status dialog is used in the email: a personal note
when confirming, the reason when rejecting or cancelling, and "a few words
about the visit" when completing.

### The daily reminder

```bash
cd backend && php artisan bookings:send-reminders --dry-run
```

```bash
cd backend && php artisan bookings:send-reminders
```

It emails every confirmed booking for tomorrow that has an email address and
has not had a reminder yet. A sent reminder is recorded on the timeline
(type `reminder`), so running it twice never emails anyone twice; a failed one
is tried again on the next run. `--dry-run` lists who would be emailed.

It is scheduled with `Schedule::command(...)->dailyAt('17:00')` in the business
time zone, which only runs where something calls the Laravel scheduler every
minute:

- **Your Mac or a normal server:** add a cron entry
  `* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1`
- **Render's free plan** has no cron and the API sleeps when idle, so the
  reminder does not run there on its own. Options: a Render Cron Job (paid)
  running `php artisan bookings:send-reminders` daily at 09:00 UTC (5:00 PM in
  Manila), or run the command by hand.

### Sending any template yourself

```php
use App\Services\BookingMailer;

// Safe: checks the address, never throws, returns 'sent', 'failed' or null.
$result = app(BookingMailer::class)->send($booking, 'booking-reminder', ['reminder_when' => 'tomorrow']);
```

Without a booking (e.g. account emails, once family accounts exist):

```php
use App\Mail\KaagapayMail;
use Illuminate\Support\Facades\Mail;

Mail::to($user->email, $user->name)->send(new KaagapayMail('password-changed', [
    'customer_name' => $user->name,
    'changed_at' => now('Asia/Manila')->format('j F Y, g:i A'),
]));
```

From a notification, return the mailable with its recipient set:

```php
public function toMail(object $notifiable): KaagapayMail
{
    return (new KaagapayMail('booking-reminder', BookingEmailData::from($this->booking, [
        'reminder_when' => 'tomorrow',
    ])))->to($this->booking->email, $this->booking->contact_person_name);
}
```

Emails are sent right away (no queue). To send in the background, make the
notification `ShouldQueue` and run `php artisan queue:work` (the `jobs` table
already exists). Render's free plan has no worker, so keep sending right away there.

### Still to connect (need new features first)

| Template | Needs |
| -------- | ----- |
| `welcome`, `email-verification`, `password-reset`, `password-changed`, `account-update` | Family accounts |
| `payment-confirmation`, `payment-failed` | Online payments |
| `companion-assigned`, `companion-profile-update`, `companion-on-the-way` | Companion records on bookings |
| `feedback-request` (and the rating in `service-completed`) | A feedback page to send `feedback_url` to |
| `support-request-received` | `POST /api/contact-messages` (the contact form is still in preview mode) |
| `general-announcement`, `promotional` | A way to choose recipients; promotional also needs opt-in and an unsubscribe page |
