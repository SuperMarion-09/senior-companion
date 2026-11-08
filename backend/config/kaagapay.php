<?php

/*
| Settings for the Kaagapay booking service. Booking dates and times are
| local Philippine time, so "today" and "upcoming" are worked out in this
| time zone (database timestamps such as created_at stay in UTC).
*/

return [

    'timezone' => env('BUSINESS_TIMEZONE', 'Asia/Manila'),

    // Shown in emails to families. Keep in sync with CONTACT in
    // frontend/src/content/siteContent.js.
    'contact_phone' => env('KAAGAPAY_CONTACT_PHONE', '+63 900 000 0000'),
    'contact_email' => env('KAAGAPAY_CONTACT_EMAIL', 'hello@kaagapay.example'),

];
