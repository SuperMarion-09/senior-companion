<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Email to the family contact person after an administrator confirms,
 * rejects or cancels their booking. Sent by BookingStatusService.
 */
class BookingStatusChanged extends Notification
{
    /** The statuses families are emailed about. */
    public const STATUSES = [Booking::STATUS_CONFIRMED, Booking::STATUS_REJECTED, Booking::STATUS_CANCELLED];

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

    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking;
        $phone = config('kaagapay.contact_phone');

        $message = (new MailMessage)->greeting("Hello {$booking->contact_person_name},");

        match ($booking->status) {
            Booking::STATUS_CONFIRMED => $message
                ->subject("Booking confirmed – {$booking->reference}")
                ->line("Good news: the companion booking for {$booking->client_name} is confirmed.")
                ->line('Your companion will arrive at the agreed time and place.'),
            Booking::STATUS_REJECTED => $message
                ->subject("Booking update – {$booking->reference}")
                ->line("We are sorry, we could not arrange a companion for {$booking->client_name} on this date."),
            Booking::STATUS_CANCELLED => $message
                ->subject("Booking cancelled – {$booking->reference}")
                ->line("The companion booking for {$booking->client_name} has been cancelled."),
        };

        if ($this->reason) {
            $message->line("Note from Kaagapay: {$this->reason}");
        }

        $message
            ->line("Reference: {$booking->reference}")
            ->line('Date: '.$booking->booking_date->format('l, j F Y'))
            ->line('Start time: '.$booking->startsAt()->format('g:i A'))
            ->line("Duration: {$booking->duration_hours} hours");

        if ($booking->status === Booking::STATUS_CONFIRMED) {
            $message->line('Kaagapay provides non-medical companionship only. Transportation, parking and other expenses are billed separately. Extending the booking on the day needs our approval.');
        }

        return $message
            ->line("Questions or changes? Call us at {$phone}.")
            ->line('In an emergency, always call 911 first.')
            ->salutation('Salamat po, Kaagapay');
    }
}
