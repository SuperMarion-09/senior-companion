<?php

namespace App\Services;

use App\Mail\KaagapayMail;
use App\Mail\Templates\BookingEmailData;
use App\Models\Booking;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Sends a booking email template to the family contact person.
 *
 * Never throws: a mail problem must not undo or block the booking change
 * that triggered it. The caller records the result on the booking timeline.
 */
class BookingMailer
{
    public function canEmail(Booking $booking): bool
    {
        return filter_var($booking->email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * @param  array<string, mixed>  $extra  template variables on top of BookingEmailData::from()
     * @return string|null 'sent', 'failed', or null when there is no valid address
     */
    public function send(Booking $booking, string $template, array $extra = []): ?string
    {
        if (! $this->canEmail($booking)) {
            return null;
        }

        try {
            Mail::to($booking->email, $booking->contact_person_name)
                ->send(new KaagapayMail($template, BookingEmailData::from($booking, $extra)));

            return 'sent';
        } catch (Throwable $e) {
            report($e);

            return 'failed';
        }
    }
}
