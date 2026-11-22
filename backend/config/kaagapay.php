<?php

/*
| Settings for the Kaagapay booking service. Booking dates and times are
| local Philippine time, so "today" and "upcoming" are worked out in this
| time zone (database timestamps such as created_at stay in UTC).
*/

// The public website (first entry of FRONTEND_URL, which may list several for CORS).
$website = rtrim(explode(',', (string) env('FRONTEND_URL', 'http://localhost:3000'))[0], '/');

return [

    'timezone' => env('BUSINESS_TIMEZONE', 'Asia/Manila'),

    // Shown in emails to families. Keep in sync with CONTACT in
    // frontend/src/content/siteContent.js.
    'contact_phone' => env('KAAGAPAY_CONTACT_PHONE', '+63 900 000 0000'),
    'contact_email' => env('KAAGAPAY_CONTACT_EMAIL', 'hello@kaagapay.example'),

    /*
    | Branding used by every email template (see docs/EMAIL_TEMPLATES.md).
    | Images must be full https:// addresses: mail apps cannot load relative
    | paths. The PNGs live in frontend/public/email/, so the website hosts them.
    */
    'email' => [
        'platform_name' => 'Kaagapay',
        'tagline' => 'May kasama ka, may kaagapay ka.',
        'website_url' => $website,
        'booking_url' => $website.'/book',
        'booking_status_url' => $website.'/booking-status',
        'privacy_url' => env('KAAGAPAY_PRIVACY_URL', $website.'/#guidelines'),
        'terms_url' => env('KAAGAPAY_TERMS_URL', $website.'/#booking-policies'),
        'support_hours' => env('KAAGAPAY_SUPPORT_HOURS', 'Monday to Saturday, 8:00 AM to 6:00 PM'),
        'address' => env('KAAGAPAY_ADDRESS', 'Metro Manila, Philippines'),
        'asset_url' => rtrim((string) env('KAAGAPAY_EMAIL_ASSET_URL', $website.'/email'), '/'),
        'signature_name' => env('KAAGAPAY_EMAIL_SIGNATURE', 'The Kaagapay care team'),

        // The browser preview at /email-previews (no login needed). Off on the
        // live site unless EMAIL_PREVIEWS=true; admins use /admin/emails there.
        'previews' => (bool) env('EMAIL_PREVIEWS', env('APP_ENV') === 'local'),
    ],

];
