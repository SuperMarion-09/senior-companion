<?php

namespace App\Mail\Templates;

use App\Models\Booking;

/**
 * Turns a Booking into the variables the email templates use, formatted the
 * way families read them ("Saturday, 28 November 2026", "8:00 AM", "3 hours").
 *
 *   new KaagapayMail('booking-reminder', BookingEmailData::from($booking, ['reminder_when' => 'tomorrow']));
 */
final class BookingEmailData
{
    /**
     * @param  array<string, mixed>  $extra  template-specific values, added on top
     * @return array<string, mixed>
     */
    public static function from(Booking $booking, array $extra = []): array
    {
        $startsAt = $booking->startsAt();
        $hours = (int) $booking->duration_hours;

        return array_merge([
            'customer_name' => $booking->contact_person_name,
            'senior_name' => $booking->client_name,
            'booking_reference' => $booking->reference,
            'service_name' => Booking::SERVICE_NAMES[$booking->service_type] ?? ucfirst((string) $booking->service_type),
            'booking_date' => $startsAt->format('l, j F Y'),
            'booking_time' => $startsAt->format('g:i A'),
            'booking_duration' => $hours.' '.($hours === 1 ? 'hour' : 'hours'),
            'booking_location' => $booking->pickup_location,
            'booking_destination' => $booking->destination,
            'booking_status' => $booking->status,
            'special_instructions' => $booking->special_instructions,
            'booking_url' => self::statusUrl($booking->reference),
        ], $extra);
    }

    /** The status page with the reference filled in, so the family only types their number. */
    public static function statusUrl(?string $reference): string
    {
        $url = config('kaagapay.email.booking_status_url');

        return filled($reference) ? $url.'?reference='.rawurlencode($reference) : $url;
    }
}
