<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\Booking;
use App\Models\BookingActivity;
use App\Notifications\BookingStatusChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Changes a booking's status following the workflow in Booking::TRANSITIONS,
 * records it on the booking's timeline and, if asked, emails the family.
 */
class BookingStatusService
{
    /**
     * @return array{booking: Booking, notification: string|null} notification: 'sent', 'failed' or null (not sent)
     *
     * @throws ValidationException when the change is not allowed
     */
    public function change(Booking $booking, Admin $admin, string $status, ?string $reason, bool $notify): array
    {
        $activity = DB::transaction(function () use ($booking, $admin, $status, $reason) {
            // Lock the row so two admins clicking at once cannot both change it.
            $locked = Booking::whereKey($booking->getKey())->lockForUpdate()->firstOrFail();

            $problem = $locked->transitionProblem($status);
            if ($problem !== null) {
                throw ValidationException::withMessages(['status' => $problem]);
            }

            $from = $locked->status;
            $locked->status = $status;
            $locked->save();

            $booking->setRawAttributes($locked->getAttributes(), true);

            return $booking->activities()->create([
                'admin_id' => $admin->id,
                'type' => BookingActivity::TYPE_STATUS,
                'from_status' => $from,
                'to_status' => $status,
                'body' => $reason,
            ]);
        });

        // Only email once the change is saved, and only to a valid address.
        $notification = null;
        if ($notify && $this->canNotify($booking)) {
            $notification = $this->sendEmail($booking, $reason);
            $activity->update(['notification' => $notification]);
        }

        return ['booking' => $booking, 'notification' => $notification];
    }

    public function canNotify(Booking $booking): bool
    {
        return in_array($booking->status, BookingStatusChanged::STATUSES, true)
            && filter_var($booking->email, FILTER_VALIDATE_EMAIL) !== false;
    }

    private function sendEmail(Booking $booking, ?string $reason): string
    {
        try {
            Notification::route('mail', [$booking->email => $booking->contact_person_name])
                ->notifyNow(new BookingStatusChanged($booking, $reason));

            return 'sent';
        } catch (Throwable $e) {
            // The status change stands; the admin is told the email failed.
            report($e);

            return 'failed';
        }
    }
}
