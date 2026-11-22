<?php

namespace App\Mail\Templates;

/**
 * Realistic, made-up data for previewing and testing every template. No real
 * family or companion appears here. Each template has a "default" scenario
 * (everything filled in), a "minimal" one (only required data, to check the
 * optional sections hide cleanly) and sometimes more.
 */
final class SampleData
{
    /**
     * @return array<string, string> scenario key => label
     */
    public static function scenarios(string $key): array
    {
        $extra = array_map(fn (array $scenario) => $scenario['label'], self::extraScenarios($key));

        return ['default' => 'Everything filled in'] + $extra + ['minimal' => 'Only required details'];
    }

    /**
     * @return array<string, mixed>
     */
    public static function for(string $key, string $scenario = 'default'): array
    {
        $template = EmailTemplates::find($key);
        $data = self::defaults($key);

        if ($scenario === 'minimal') {
            return array_intersect_key($data, $template->required);
        }

        return array_merge($data, self::extraScenarios($key)[$scenario]['data'] ?? []);
    }

    /**
     * Sample data for a preview, with an optional booking status and the
     * values someone typed in the preview page on top. Only the template's
     * own variables are accepted; anything else is ignored.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    public static function forPreview(string $key, string $scenario = 'default', ?string $status = null, array $overrides = []): array
    {
        $template = EmailTemplates::find($key);
        $data = self::for($key, array_key_exists($scenario, self::scenarios($key)) ? $scenario : 'default');

        foreach (array_intersect_key($overrides, array_flip($template->variableNames())) as $name => $value) {
            if (is_string($value) || $value === null) {
                $data[$name] = $value === null ? null : mb_substr($value, 0, 5000);
            } elseif (is_array($value) && array_is_list($value)) {
                // Lists: plain strings, or rows of strings such as {label, amount}.
                $data[$name] = array_values(array_filter(array_map(function ($item) {
                    if (is_scalar($item)) {
                        return (string) $item;
                    }

                    return is_array($item) ? array_map(fn ($v) => is_scalar($v) ? (string) $v : '', $item) : null;
                }, array_slice($value, 0, 20)), fn ($item) => $item !== null));
            }
        }

        if ($status !== null && $template->usesBookingStatus() && array_key_exists($status, EmailTheme::STATUSES)) {
            $data['booking_status'] = $status;
        }

        return $data;
    }

    /**
     * The booking every booking sample is about.
     *
     * @return array<string, string>
     */
    private static function booking(): array
    {
        return [
            'customer_name' => 'Ana Reyes',
            'senior_name' => 'Lola Remedios',
            'booking_reference' => 'KGP-7H4QMD',
            'service_name' => 'Walking Companion',
            'booking_date' => 'Saturday, 28 November 2026',
            'booking_time' => '8:00 AM',
            'booking_duration' => '3 hours',
            'booking_location' => '12 Mabini Street, Barangay San Roque, Marikina City',
            'booking_destination' => 'Marikina River Park',
            'booking_url' => config('kaagapay.email.booking_status_url'),
        ];
    }

    private static function url(string $path): string
    {
        return config('kaagapay.email.website_url').$path;
    }

    /**
     * @return array<string, mixed>
     */
    private static function defaults(string $key): array
    {
        $booking = self::booking();
        $companion = [
            'companion_name' => 'Joy Mercado',
            'companion_bio' => 'Joy spent ten years caring for her own grandmother and loves a slow morning walk with good stories. She is patient, cheerful and always on time.',
            'companion_experience' => '4 years',
            'companion_languages' => 'Tagalog, English, Ilocano',
            'companion_interests' => 'Gardening, old OPM songs, cooking',
            'companion_profile_url' => self::url('/companions/joy-m'),
        ];

        return match ($key) {
            'welcome' => [
                'customer_name' => 'Ana',
                'booking_url' => config('kaagapay.email.booking_url'),
            ],
            'email-verification' => [
                'customer_name' => 'Ana',
                'verification_link' => self::url('/verify-email?token=sample-7f3c2a'),
                'verification_code' => '482 913',
                'link_expires_in' => '60 minutes',
            ],
            'password-reset' => [
                'customer_name' => 'Ana',
                'reset_password_link' => self::url('/reset-password?token=sample-91be44'),
                'link_expires_in' => '60 minutes',
                'request_device' => 'Chrome on an Android phone',
                'request_time' => 'Sunday, 22 November 2026, 3:15 PM',
            ],
            'password-changed' => [
                'customer_name' => 'Ana',
                'changed_at' => 'Sunday, 22 November 2026, 3:21 PM',
                'request_device' => 'Chrome on an Android phone',
                'secure_account_url' => self::url('/forgot-password'),
            ],
            'booking-confirmation' => $booking + [
                'booking_status' => 'confirmed',
                'companion_name' => 'Joy Mercado',
                'total_amount' => '₱1,950.00',
                'special_instructions' => 'Lola walks slowly and likes to rest on a bench every 20 minutes. She takes her blood pressure tablet at 9 AM.',
            ],
            'booking-request-received' => $booking + [
                'booking_status' => 'pending',
                'response_time' => 'within one business day',
            ],
            'booking-approved' => $booking + [
                'booking_status' => 'confirmed',
                'companion_name' => 'Joy Mercado',
                'admin_note' => 'We matched Lola with Joy, who also loves gardening. They will have lots to talk about!',
            ],
            'booking-rejected' => array_diff_key($booking, ['booking_url' => true]) + [
                'booking_status' => 'rejected',
                'reason' => 'All our companions in Marikina are already booked that Saturday morning. We have free companions on Sunday, 29 November from 8:00 AM.',
            ],
            'booking-reminder' => $booking + [
                'booking_status' => 'confirmed',
                'reminder_when' => 'tomorrow',
                'companion_name' => 'Joy Mercado',
            ],
            'booking-cancellation' => array_diff_key($booking, ['booking_url' => true]) + [
                'booking_status' => 'cancelled',
                'cancelled_by' => 'family',
                'reason' => 'Lola Remedios has a doctor\'s check-up that morning.',
                'refund_note' => 'Your payment of ₱1,950.00 will be returned to your GCash account within 3 to 5 business days.',
            ],
            'booking-rescheduled' => [
                'booking_status' => 'rescheduled',
                'booking_date' => 'Sunday, 29 November 2026',
                'booking_time' => '9:00 AM',
                'previous_booking_date' => 'Saturday, 28 November 2026',
                'previous_booking_time' => '8:00 AM',
                'reason' => 'Joy, your companion, asked to move the visit by one day because of a family matter. We are sorry for the change.',
                'companion_name' => 'Joy Mercado',
            ] + $booking,
            'payment-confirmation' => array_diff_key($booking, ['booking_location' => true, 'booking_destination' => true]) + [
                'total_amount' => '₱1,950.00',
                'payment_reference' => 'PAY-2026-118204',
                'payment_method' => 'GCash (0917 ••• 4521)',
                'paid_at' => 'Sunday, 22 November 2026, 4:02 PM',
                'line_items' => [
                    ['label' => 'Walking Companion, 3 hours × ₱600', 'amount' => '₱1,800.00'],
                    ['label' => 'Booking fee', 'amount' => '₱150.00'],
                ],
                'receipt_url' => self::url('/receipts/PAY-2026-118204'),
            ],
            'payment-failed' => array_diff_key($booking, ['booking_location' => true, 'booking_destination' => true, 'booking_url' => true]) + [
                'total_amount' => '₱1,950.00',
                'payment_method' => 'Visa ending in 4242',
                'failure_reason' => 'Your bank did not approve the payment. This often happens when a card is used online for the first time.',
                'retry_url' => self::url('/pay/KGP-7H4QMD'),
                'retry_deadline' => 'Tuesday, 24 November 2026, 6:00 PM',
            ],
            'companion-assigned' => $booking + $companion,
            'companion-profile-update' => array_diff_key($booking, ['booking_location' => true, 'booking_destination' => true, 'booking_duration' => true]) + [
                'companion_name' => 'Joy Mercado',
                'update_note' => 'Joy has finished her first-aid refresher course, and she will now come by e-bike so she can arrive closer to the door.',
                'changes' => [
                    ['label' => 'Training', 'value' => 'Basic First Aid (renewed November 2026)'],
                    ['label' => 'Travels by', 'value' => 'E-bike', 'previous' => 'Jeepney'],
                ],
                'companion_profile_url' => self::url('/companions/joy-m'),
            ],
            'companion-on-the-way' => array_diff_key($booking, ['booking_destination' => true, 'booking_duration' => true, 'booking_date' => true]) + [
                'companion_name' => 'Joy Mercado',
                'eta' => 'in about 20 minutes',
                'arrival_time' => '7:55 AM',
                'companion_phone' => '+63 917 555 0142',
                'tracking_url' => self::url('/track/KGP-7H4QMD'),
            ],
            'service-completed' => array_diff_key($booking, ['booking_location' => true, 'booking_destination' => true, 'booking_url' => true]) + [
                'companion_name' => 'Joy Mercado',
                'visit_summary' => 'We walked two slow rounds of the river park and stopped for taho. Lola told me all about her years teaching in Bicol. She was smiling the whole way home!',
                'feedback_url' => self::url('/feedback/KGP-7H4QMD'),
                'rebook_url' => config('kaagapay.email.booking_url').'?service=walking',
            ],
            'feedback-request' => [
                'customer_name' => 'Ana',
                'senior_name' => 'Lola Remedios',
                'booking_reference' => 'KGP-7H4QMD',
                'service_name' => 'Walking Companion',
                'booking_date' => 'Saturday, 28 November',
                'companion_name' => 'Joy Mercado',
                'feedback_url' => self::url('/feedback/KGP-7H4QMD'),
            ],
            'account-update' => [
                'customer_name' => 'Ana',
                'changed_at' => 'Sunday, 22 November 2026, 5:10 PM',
                'changes' => [
                    ['label' => 'Mobile number', 'value' => '0917 555 0188', 'previous' => '0917 555 0123'],
                    ['label' => 'Emergency contact', 'value' => 'Miguel Reyes (son)'],
                ],
                'account_url' => self::url('/account'),
            ],
            'support-request-received' => [
                'customer_name' => 'Ana',
                'ticket_reference' => 'SR-20481',
                'request_subject' => 'Changing the meeting place',
                'request_message' => 'Hello po! For Saturday, can Joy meet Lola at the church instead of the house? She will be at the 7 AM mass. Thank you.',
                'response_time' => 'within one business day',
                'request_url' => self::url('/support/SR-20481'),
            ],
            'general-announcement' => [
                'customer_name' => 'Ana',
                'announcement_title' => 'Our holiday schedule for December',
                'announcement_summary' => 'Companions are available all December, with a short break on Christmas and New Year.',
                'announcement_body' => "Maligayang Pasko from all of us at Kaagapay! Many families plan visits, shopping trips and Simbang Gabi during the holidays, so we have opened more companion hours this December.\n\nPlease book at least three days ahead, as times fill up quickly.",
                'announcement_highlights' => [
                    'Open every day from 1 to 23 December, including Sundays.',
                    'Closed on 24–25 December and 31 December–1 January.',
                    'Our phone line stays open for urgent changes.',
                ],
                'cta_label' => 'Book a holiday visit',
                'cta_url' => config('kaagapay.email.booking_url'),
            ],
            'promotional' => [
                'customer_name' => 'Ana',
                'offer_title' => 'A free extra hour for your next walk',
                'offer_summary' => 'Book a 3-hour Walking Companion visit in December and the fourth hour is on us.',
                'offer_description' => "Thank you for walking with us this year. To say salamat, your next Walking Companion visit of 3 hours or more comes with one extra hour, free.\n\nMore time for the park, the market, or simply a longer chat.",
                'offer_code' => 'SALAMAT4',
                'offer_expires' => '31 December 2026',
                'offer_terms' => 'One free hour per family. Not combined with other offers.',
                'cta_label' => 'Book a walk',
                'cta_url' => config('kaagapay.email.booking_url').'?service=walking',
                'unsubscribe_url' => self::url('/unsubscribe?token=sample-a1b2c3'),
            ],
            default => [],
        };
    }

    /**
     * Extra scenarios per template: label and the data that changes.
     *
     * @return array<string, array{label: string, data: array<string, mixed>}>
     */
    private static function extraScenarios(string $key): array
    {
        return match ($key) {
            'booking-confirmation' => [
                'no-companion' => ['label' => 'Companion not chosen yet', 'data' => ['companion_name' => null]],
            ],
            'booking-approved' => [
                'no-note' => ['label' => 'No companion or note yet', 'data' => ['companion_name' => null, 'admin_note' => null]],
            ],
            'booking-rejected' => [
                'no-reason' => ['label' => 'No reason given', 'data' => ['reason' => null]],
            ],
            'booking-reminder' => [
                'today' => ['label' => 'Visit is today', 'data' => ['reminder_when' => 'today']],
            ],
            'booking-cancellation' => [
                'by-kaagapay' => ['label' => 'Cancelled by Kaagapay', 'data' => [
                    'cancelled_by' => 'kaagapay',
                    'reason' => 'A typhoon warning (Signal No. 2) was raised for Marikina, so we cancelled all outdoor visits for everyone\'s safety.',
                ]],
            ],
            'payment-failed' => [
                'expired-card' => ['label' => 'Card has expired', 'data' => ['failure_reason' => 'The card ending in 4242 expired in October 2026.']],
            ],
            'companion-on-the-way' => [
                'no-tracking' => ['label' => 'No live tracking (call button)', 'data' => ['tracking_url' => null]],
            ],
            'email-verification' => [
                'link-only' => ['label' => 'Link only, no code', 'data' => ['verification_code' => null]],
            ],
            default => [],
        };
    }
}
