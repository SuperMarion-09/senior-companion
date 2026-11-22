<?php

namespace App\Notifications;

use App\Mail\KaagapayMail;
use App\Mail\Templates\BookingEmailData;
use App\Models\Booking;
use Illuminate\Notifications\Notification;

/**
 * Email to the family contact person after an administrator confirms,
 * rejects, cancels or completes their booking. Sent by BookingStatusService.
 *
 * Uses the branded templates in resources/views/emails/templates/
 * (see docs/EMAIL_TEMPLATES.md).
 */
class BookingStatusChanged extends Notification
{
    /** The statuses families are emailed about. */
    public const STATUSES = [Booking::STATUS_CONFIRMED, Booking::STATUS_REJECTED, Booking::STATUS_CANCELLED, Booking::STATUS_COMPLETED];

    /** Which email template each status uses. */
    public const TEMPLATES = [
        Booking::STATUS_CONFIRMED => 'booking-approved',
        Booking::STATUS_REJECTED => 'booking-rejected',
        Booking::STATUS_CANCELLED => 'booking-cancellation',
        Booking::STATUS_COMPLETED => 'service-completed',
    ];

    public function __construct(
        public Booking $booking,
        public ?string $reason = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): KaagapayMail
    {
        $booking = $this->booking;
        $template = self::TEMPLATES[$booking->status];

        // What the admin typed: a personal note when approving, a few words
        // about the visit when completing, the reason otherwise.
        $extra = match ($booking->status) {
            Booking::STATUS_CONFIRMED => ['admin_note' => $this->reason],
            Booking::STATUS_COMPLETED => ['visit_summary' => $this->reason, 'rebook_url' => config('kaagapay.email.booking_url')],
            default => ['reason' => $this->reason],
        };

        return (new KaagapayMail($template, BookingEmailData::from($booking, $extra)))
            ->to(...$this->recipient($notifiable));
    }

    /**
     * BookingStatusService routes the email as [address => name].
     *
     * @return array{0: string, 1: string|null}
     */
    private function recipient(object $notifiable): array
    {
        $route = $notifiable->routeNotificationFor('mail', $this);

        if (is_array($route)) {
            $address = array_key_first($route);

            return is_string($address) ? [$address, $route[$address]] : [(string) reset($route), null];
        }

        return [(string) $route, $this->booking->contact_person_name];
    }
}
