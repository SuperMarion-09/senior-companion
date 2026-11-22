<?php

namespace App\Mail\Templates;

use InvalidArgumentException;

/**
 * Every email template Kaagapay can send. To add one:
 *   1. add an EmailTemplate below,
 *   2. create resources/views/emails/templates/{key}.blade.php,
 *   3. add sample data in SampleData::for().
 * See docs/EMAIL_TEMPLATES.md for the full guide.
 */
final class EmailTemplates
{
    public const CATEGORY_ACCOUNT = 'Account and sign-in';

    public const CATEGORY_BOOKING = 'Bookings and payments';

    public const CATEGORY_COMPANION = 'Companions and visits';

    public const CATEGORY_GENERAL = 'Account notices and news';

    public const CATEGORIES = [
        self::CATEGORY_ACCOUNT,
        self::CATEGORY_BOOKING,
        self::CATEGORY_COMPANION,
        self::CATEGORY_GENERAL,
    ];

    /** Names the layout uses itself; templates must not define variables with these names. */
    public const RESERVED = ['brand', 'meta', 'message', 'slot', 'attributes'];

    /** @var array<string, EmailTemplate>|null */
    private static ?array $cache = null;

    /**
     * @return array<string, EmailTemplate> keyed by template key, in display order
     */
    public static function all(): array
    {
        if (self::$cache === null) {
            self::$cache = [];
            foreach (self::definitions() as $template) {
                self::$cache[$template->key] = $template;
            }
        }

        return self::$cache;
    }

    public static function has(string $key): bool
    {
        return array_key_exists($key, self::all());
    }

    public static function find(string $key): EmailTemplate
    {
        return self::all()[$key] ?? throw new InvalidArgumentException("Unknown email template [{$key}].");
    }

    /**
     * Variables that describe one booking. Shared by most booking templates.
     *
     * @return array<string, string>
     */
    private static function booking(string ...$except): array
    {
        $fields = [
            'senior_name' => 'Name of the senior the companion is for',
            'booking_reference' => 'Booking reference, e.g. KGP-7H4QMD',
            'service_name' => 'Service, e.g. Walking Companion',
            'booking_date' => 'Formatted date, e.g. Saturday, 28 November 2026',
            'booking_time' => 'Formatted start time, e.g. 8:00 AM',
            'booking_duration' => 'Length of the visit, e.g. 3 hours',
            'booking_location' => 'Pick-up or meeting place',
            'booking_destination' => 'Where they are going, if anywhere',
            'booking_url' => 'Link to the booking status page',
        ];

        return array_diff_key($fields, array_flip($except));
    }

    /**
     * @return array<int, EmailTemplate>
     */
    private static function definitions(): array
    {
        $customer = ['customer_name' => 'First name or full name of the person reading the email'];

        return [
            /* ---------------------------------------------- A. Account and sign-in */
            new EmailTemplate(
                key: 'welcome',
                name: 'Welcome',
                category: self::CATEGORY_ACCOUNT,
                description: 'Greets a family after they create an account and shows how booking works.',
                trigger: 'After a family registers an account.',
                subject: 'Welcome to Kaagapay, {{customer_name}}',
                preheader: 'We are glad you are here. Here is how booking a companion works.',
                required: $customer,
                optional: [
                    'booking_url' => 'Link to the booking form',
                ],
                footerReason: 'You are receiving this email because you created a Kaagapay account.',
            ),
            new EmailTemplate(
                key: 'email-verification',
                name: 'Email verification',
                category: self::CATEGORY_ACCOUNT,
                description: 'Asks a new user to confirm their email address.',
                trigger: 'After registering, or when a family changes their email address.',
                subject: 'Please confirm your email address',
                preheader: 'One quick step so we can send your booking updates safely.',
                required: $customer + [
                    'verification_link' => 'Signed link that confirms the address',
                ],
                optional: [
                    'verification_code' => 'Six-digit code, for people who prefer typing it',
                    'link_expires_in' => 'How long the link works, e.g. 60 minutes',
                ],
                footerReason: 'You are receiving this email because this address was used to create a Kaagapay account.',
            ),
            new EmailTemplate(
                key: 'password-reset',
                name: 'Password reset',
                category: self::CATEGORY_ACCOUNT,
                description: 'Sends a secure link to choose a new password.',
                trigger: 'When someone asks to reset the password for this email address.',
                subject: 'Reset your Kaagapay password',
                preheader: 'Use the secure link inside to choose a new password.',
                required: $customer + [
                    'reset_password_link' => 'Signed password reset link',
                ],
                optional: [
                    'link_expires_in' => 'How long the link works, e.g. 60 minutes',
                    'request_device' => 'Device or browser that asked, e.g. Chrome on Android',
                    'request_time' => 'When it was asked, e.g. 22 November 2026, 3:15 PM',
                ],
                footerReason: 'You are receiving this email because a password reset was requested for your Kaagapay account.',
            ),
            new EmailTemplate(
                key: 'password-changed',
                name: 'Password changed',
                category: self::CATEGORY_ACCOUNT,
                description: 'Confirms the password was changed and explains what to do if it was not them.',
                trigger: 'Right after a password is changed or reset.',
                subject: 'Your Kaagapay password was changed',
                preheader: 'This is a quick security notice. No action is needed if this was you.',
                required: $customer,
                optional: [
                    'changed_at' => 'When it changed, e.g. 22 November 2026, 3:21 PM',
                    'request_device' => 'Device or browser used',
                    'secure_account_url' => 'Link to reset the password again',
                ],
            ),

            /* -------------------------------------------- B. Bookings and payments */
            new EmailTemplate(
                key: 'booking-confirmation',
                name: 'Booking confirmation',
                category: self::CATEGORY_BOOKING,
                description: 'The full summary of a confirmed booking: details, companion, cost and how to prepare.',
                trigger: 'When a booking is fully confirmed, e.g. entered by an admin or paid.',
                subject: 'Your booking is confirmed – {{booking_reference}}',
                preheader: 'Everything you need for the visit on {{booking_date}} at {{booking_time}}.',
                required: $customer + ['booking_reference' => 'Booking reference', 'booking_date' => 'Formatted date', 'booking_time' => 'Formatted start time'],
                optional: self::booking('booking_reference', 'booking_date', 'booking_time') + [
                    'booking_status' => 'pending, confirmed, rescheduled, cancelled, rejected or completed',
                    'companion_name' => 'Assigned companion, when known',
                    'total_amount' => 'Formatted total, e.g. ₱1,950.00',
                    'special_instructions' => 'Notes the family gave us',
                ],
            ),
            new EmailTemplate(
                key: 'booking-request-received',
                name: 'Booking request received',
                category: self::CATEGORY_BOOKING,
                description: 'Reassures the family that we have their request and explains what happens next.',
                trigger: 'When a family sends the booking form (status: pending).',
                subject: 'We received your booking request – {{booking_reference}}',
                preheader: 'Thank you. Our team will review it and contact you within one business day.',
                required: $customer + ['booking_reference' => 'Booking reference'],
                optional: self::booking('booking_reference') + [
                    'booking_status' => 'Usually pending',
                    'response_time' => 'When we reply, e.g. within one business day',
                ],
            ),
            new EmailTemplate(
                key: 'booking-approved',
                name: 'Booking approved',
                category: self::CATEGORY_BOOKING,
                description: 'Good news: an admin approved a pending booking request.',
                trigger: 'Sent today: an admin confirms a pending booking with "Email the family" ticked.',
                subject: 'Good news: your booking is confirmed – {{booking_reference}}',
                preheader: '{{senior_name|Your loved one}}\'s companion visit on {{booking_date}} is all set.',
                required: $customer + ['booking_reference' => 'Booking reference', 'booking_date' => 'Formatted date'],
                optional: self::booking('booking_reference', 'booking_date') + [
                    'booking_status' => 'Usually confirmed',
                    'companion_name' => 'Assigned companion, when known',
                    'admin_note' => 'Personal note from the admin who approved it',
                ],
            ),
            new EmailTemplate(
                key: 'booking-rejected',
                name: 'Booking not available',
                category: self::CATEGORY_BOOKING,
                description: 'Kindly explains that we could not arrange the visit and offers other options.',
                trigger: 'Sent today: an admin rejects a pending booking with "Email the family" ticked.',
                subject: 'About your booking request – {{booking_reference}}',
                preheader: 'We are sorry we could not arrange this visit. Here is how we can still help.',
                required: $customer + ['booking_reference' => 'Booking reference'],
                optional: self::booking('booking_reference', 'booking_url') + [
                    'booking_status' => 'Usually rejected',
                    'reason' => 'Why it was not possible, in plain words',
                ],
            ),
            new EmailTemplate(
                key: 'booking-reminder',
                name: 'Booking reminder',
                category: self::CATEGORY_BOOKING,
                description: 'A friendly reminder before an upcoming visit, with a short checklist.',
                trigger: 'The day before a confirmed visit (a scheduled job).',
                subject: 'Reminder: {{senior_name|your loved one}}\'s visit is {{reminder_when}}',
                preheader: '{{booking_time}} on {{booking_date}}. Here is a short checklist to get ready.',
                required: $customer + ['booking_reference' => 'Booking reference', 'booking_date' => 'Formatted date', 'booking_time' => 'Formatted start time', 'reminder_when' => 'tomorrow, today or in 2 days'],
                optional: self::booking('booking_reference', 'booking_date', 'booking_time') + [
                    'booking_status' => 'Usually confirmed',
                    'companion_name' => 'Assigned companion, when known',
                ],
            ),
            new EmailTemplate(
                key: 'booking-cancellation',
                name: 'Booking cancelled',
                category: self::CATEGORY_BOOKING,
                description: 'Confirms a booking was cancelled, by the family or by Kaagapay.',
                trigger: 'Sent today: an admin cancels a booking with "Email the family" ticked.',
                subject: 'Your booking has been cancelled – {{booking_reference}}',
                preheader: 'Booking {{booking_reference}} has been cancelled. We are here if you need us.',
                required: $customer + ['booking_reference' => 'Booking reference'],
                optional: self::booking('booking_reference', 'booking_url') + [
                    'booking_status' => 'Usually cancelled',
                    'cancelled_by' => 'family, kaagapay, or empty for neutral wording',
                    'reason' => 'Why it was cancelled',
                    'refund_note' => 'What happens to any payment',
                ],
            ),
            new EmailTemplate(
                key: 'booking-rescheduled',
                name: 'Booking rescheduled',
                category: self::CATEGORY_BOOKING,
                description: 'Shows the new date and time next to the old one, so the change is easy to see.',
                trigger: 'When an admin changes the date or start time of a booking.',
                subject: 'New date for your booking – {{booking_reference}}',
                preheader: 'The visit is now on {{booking_date}} at {{booking_time}}.',
                required: $customer + ['booking_reference' => 'Booking reference', 'booking_date' => 'New date', 'booking_time' => 'New start time'],
                optional: self::booking('booking_reference', 'booking_date', 'booking_time') + [
                    'booking_status' => 'Usually rescheduled or confirmed',
                    'previous_booking_date' => 'The old date',
                    'previous_booking_time' => 'The old start time',
                    'reason' => 'Why it changed',
                    'companion_name' => 'Assigned companion, when known',
                ],
            ),
            new EmailTemplate(
                key: 'payment-confirmation',
                name: 'Payment received',
                category: self::CATEGORY_BOOKING,
                description: 'A receipt: what was paid, how, and for which booking.',
                trigger: 'When a payment for a booking succeeds.',
                subject: 'Payment received – {{payment_reference}}',
                preheader: 'Thank you. We received your payment of {{total_amount}}.',
                required: $customer + ['total_amount' => 'Formatted total, e.g. ₱1,950.00', 'payment_reference' => 'Payment or receipt number'],
                optional: self::booking('booking_location', 'booking_destination') + [
                    'payment_method' => 'e.g. GCash or Visa ending 4242',
                    'paid_at' => 'When it was paid',
                    'line_items' => 'List of {label, amount} rows',
                    'receipt_url' => 'Link to a printable receipt',
                ],
            ),
            new EmailTemplate(
                key: 'payment-failed',
                name: 'Payment unsuccessful',
                category: self::CATEGORY_BOOKING,
                description: 'Calmly explains a payment did not go through and how to try again.',
                trigger: 'When a payment for a booking fails.',
                subject: 'Your payment did not go through',
                preheader: 'No money was taken. It only takes a minute to try again.',
                required: $customer + ['total_amount' => 'Formatted amount', 'retry_url' => 'Link to try the payment again'],
                optional: self::booking('booking_location', 'booking_destination', 'booking_url') + [
                    'payment_method' => 'e.g. Visa ending 4242',
                    'failure_reason' => 'Plain-language reason, e.g. the card has expired',
                    'retry_deadline' => 'Until when we hold the booking',
                ],
            ),

            /* -------------------------------------------- C. Companions and visits */
            new EmailTemplate(
                key: 'companion-assigned',
                name: 'Companion assigned',
                category: self::CATEGORY_COMPANION,
                description: 'Introduces the companion who will visit, so the family knows who to expect.',
                trigger: 'When a companion is assigned to a booking.',
                subject: 'Meet {{companion_name}}, your Kaagapay companion',
                preheader: '{{companion_name}} will be the companion for {{senior_name|your loved one}}.',
                required: $customer + ['companion_name' => 'Companion\'s first name and last initial'],
                optional: self::booking() + [
                    'companion_photo_url' => 'https:// photo, square, at least 160px',
                    'companion_bio' => 'A few warm sentences about them',
                    'companion_experience' => 'e.g. 4 years with Kaagapay',
                    'companion_languages' => 'e.g. Tagalog, English, Ilocano',
                    'companion_interests' => 'e.g. Gardening, old movies, chess',
                    'companion_profile_url' => 'Link to their full profile',
                ],
            ),
            new EmailTemplate(
                key: 'companion-profile-update',
                name: 'Companion details updated',
                category: self::CATEGORY_COMPANION,
                description: 'Lets the family know something relevant about their companion changed.',
                trigger: 'When a companion\'s profile changes for an upcoming booking.',
                subject: 'An update about {{companion_name}}',
                preheader: 'A small change to {{companion_name}}\'s details for your upcoming visit.',
                required: $customer + ['companion_name' => 'Companion\'s name'],
                optional: self::booking('booking_location', 'booking_destination', 'booking_duration') + [
                    'changes' => 'List of {label, value} rows that changed',
                    'update_note' => 'A short explanation',
                    'companion_photo_url' => 'https:// photo',
                    'companion_profile_url' => 'Link to their full profile',
                ],
            ),
            new EmailTemplate(
                key: 'companion-on-the-way',
                name: 'Companion on the way',
                category: self::CATEGORY_COMPANION,
                description: 'Tells the family their companion has left and when they will arrive.',
                trigger: 'When the companion starts travelling to the visit (if the app tracks it).',
                subject: '{{companion_name}} is on the way',
                preheader: 'Expected to arrive {{eta}}.',
                required: $customer + ['companion_name' => 'Companion\'s name', 'eta' => 'e.g. in about 20 minutes'],
                optional: self::booking('booking_destination', 'booking_duration', 'booking_date') + [
                    'arrival_time' => 'Expected clock time, e.g. 7:55 AM',
                    'companion_phone' => 'Number to call or text the companion',
                    'companion_photo_url' => 'https:// photo, so the senior recognises them',
                    'tracking_url' => 'Live location link',
                ],
            ),
            new EmailTemplate(
                key: 'service-completed',
                name: 'Visit completed',
                category: self::CATEGORY_COMPANION,
                description: 'Thanks the family after a visit, shares the companion\'s note and asks for feedback.',
                trigger: 'When an admin marks a booking as completed.',
                subject: 'Thank you for spending time with us, {{customer_name}}',
                preheader: 'How was the visit with {{companion_name|your companion}}? We would love to hear.',
                required: $customer,
                optional: self::booking('booking_destination', 'booking_location', 'booking_url') + [
                    'companion_name' => 'Companion\'s name',
                    'visit_summary' => 'A short note from the companion about the visit',
                    'feedback_url' => 'Link to the feedback form',
                    'rebook_url' => 'Link to book again',
                ],
            ),
            new EmailTemplate(
                key: 'feedback-request',
                name: 'Feedback request',
                category: self::CATEGORY_COMPANION,
                description: 'Asks for a one-tap rating of a recent visit.',
                trigger: 'A day or two after a completed visit, if no feedback was given.',
                subject: 'How was {{senior_name|your loved one}}\'s visit?',
                preheader: 'One tap is enough. Your answer helps us care better.',
                required: $customer + ['feedback_url' => 'Feedback link; ?rating=1 to 5 is added to each star'],
                optional: self::booking('booking_location', 'booking_destination', 'booking_duration', 'booking_url', 'booking_time') + [
                    'companion_name' => 'Companion\'s name',
                ],
            ),

            /* --------------------------------------- D. Account notices and news */
            new EmailTemplate(
                key: 'account-update',
                name: 'Account details changed',
                category: self::CATEGORY_GENERAL,
                description: 'Notifies the family that important account details changed.',
                trigger: 'When contact details, email or phone on an account change.',
                subject: 'Your Kaagapay account details were updated',
                preheader: 'Please take a moment to check the changes are correct.',
                required: $customer,
                optional: [
                    'changes' => 'List of {label, value} rows',
                    'changed_at' => 'When it changed',
                    'account_url' => 'Link to the account page',
                ],
            ),
            new EmailTemplate(
                key: 'support-request-received',
                name: 'Support request received',
                category: self::CATEGORY_GENERAL,
                description: 'Confirms a message or support request reached the team.',
                trigger: 'When the contact form or a support request is sent.',
                subject: 'We received your message – {{ticket_reference}}',
                preheader: 'A real person from our team will reply {{response_time|within one business day}}.',
                required: $customer + ['ticket_reference' => 'Request number, e.g. SR-20481'],
                optional: [
                    'request_subject' => 'What it is about',
                    'request_message' => 'What they wrote (shortened if long)',
                    'response_time' => 'e.g. within one business day',
                    'request_url' => 'Link to view the request',
                ],
                footerReason: 'You are receiving this email because you contacted Kaagapay.',
            ),
            new EmailTemplate(
                key: 'general-announcement',
                name: 'Announcement',
                category: self::CATEGORY_GENERAL,
                description: 'Shares important news, such as holiday hours or a new service area.',
                trigger: 'Sent by the team to all families with an account.',
                subject: '{{announcement_title}}',
                preheader: '{{announcement_summary|An important update from Kaagapay.}}',
                required: $customer + ['announcement_title' => 'Headline', 'announcement_body' => 'The message; blank lines start a new paragraph'],
                optional: [
                    'announcement_summary' => 'One line shown in the inbox preview',
                    'announcement_highlights' => 'List of short points',
                    'cta_label' => 'Button text',
                    'cta_url' => 'Button link',
                ],
                footerReason: 'You are receiving this important service notice because you have a Kaagapay account.',
            ),
            new EmailTemplate(
                key: 'promotional',
                name: 'Special offer',
                category: self::CATEGORY_GENERAL,
                description: 'A gentle, non-pushy offer or service update. Includes an unsubscribe link.',
                trigger: 'Sent by the team to families who agreed to receive news and offers.',
                subject: '{{offer_title}}',
                preheader: '{{offer_summary|A little something from all of us at Kaagapay.}}',
                required: $customer + ['offer_title' => 'Headline', 'offer_description' => 'What the offer is', 'unsubscribe_url' => 'One-click unsubscribe link'],
                optional: [
                    'offer_summary' => 'One line for the inbox preview',
                    'offer_code' => 'Promo code to type when booking',
                    'offer_expires' => 'Last day, e.g. 31 December 2026',
                    'offer_terms' => 'Short conditions',
                    'cta_label' => 'Button text',
                    'cta_url' => 'Button link',
                ],
                marketing: true,
                footerReason: 'You are receiving this because you agreed to hear about Kaagapay news and offers.',
            ),
        ];
    }
}
