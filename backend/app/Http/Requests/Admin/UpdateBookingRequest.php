<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BookingRules;
use App\Models\Booking;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateBookingRequest extends FormRequest
{
    /**
     * Only logged-in admins reach this request (auth:sanctum on the route).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return BookingRules::fields() + [
            // The booking's updated_at when the admin opened the form, to detect
            // another admin saving changes in the meantime.
            'updated_at' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return BookingRules::messages();
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                /** @var Booking $booking */
                $booking = $this->route('booking');
                $date = $this->input('booking_date');
                $time = $this->input('start_time');

                // Moving a booking must be to a future time; leaving the date
                // and time as they were is always fine.
                if ($date !== $booking->booking_date->format('Y-m-d') || $time !== substr($booking->start_time, 0, 5)) {
                    BookingRules::checkSchedule($validator, $date, $time);
                }
            },
        ];
    }
}
