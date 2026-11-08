<?php

namespace App\Http\Requests;

use App\Models\Booking;
use App\Rules\PhilippinePhone;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Validation rules for the booking fields, shared by the public booking form
 * and the admin edit form. The same rules as frontend/src/utils/booking.js.
 */
class BookingRules
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public static function fields(): array
    {
        return [
            'client_name' => ['required', 'string', 'max:100'],
            'contact_person_name' => ['required', 'string', 'max:100'],
            'contact_number' => ['required', 'string', 'max:30', new PhilippinePhone],
            'email' => ['nullable', 'string', 'email:rfc', 'max:255'],
            'emergency_contact_name' => ['required', 'string', 'max:100'],
            'emergency_contact_number' => ['required', 'string', 'max:30', new PhilippinePhone],
            'service_type' => ['required', 'string', Rule::in(Booking::SERVICE_TYPES)],
            'booking_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'string', Rule::in(Booking::startTimes())],
            'duration_hours' => [
                'required', 'integer',
                'min:'.Booking::MIN_DURATION_HOURS,
                'max:'.Booking::MAX_DURATION_HOURS,
            ],
            'pickup_location' => ['required', 'string', 'max:255'],
            'destination' => ['required', 'string', 'max:255'],
            'planned_activity' => ['nullable', 'string', 'max:255'],
            'special_instructions' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'duration_hours.min' => 'The minimum booking is '.Booking::MIN_DURATION_HOURS.' hours.',
            'duration_hours.max' => 'For bookings longer than '.Booking::MAX_DURATION_HOURS.' hours, please contact us.',
            'start_time.in' => 'Please choose a start time between 7:00 AM and 5:00 PM.',
            'service_type.in' => 'Please choose the type of service.',
        ];
    }

    /**
     * Adds an error when the date and time are in the past or too far ahead.
     * Skipped when the fields already have a format error.
     */
    public static function checkSchedule(Validator $validator, mixed $date, mixed $time): void
    {
        if ($validator->errors()->hasAny(['booking_date', 'start_time'])) {
            return;
        }

        $now = Booking::now();

        if ($date < $now->toDateString()) {
            $validator->errors()->add('booking_date', 'This date has already passed. Please choose today or a later date.');
        } elseif ($date > $now->addDays(Booking::MAX_DAYS_AHEAD)->toDateString()) {
            $validator->errors()->add('booking_date', 'Bookings can be made up to 6 months ahead. Please choose an earlier date.');
        } elseif ($date === $now->toDateString() && $time <= $now->format('H:i')) {
            $validator->errors()->add('start_time', 'This time has already passed today. Please choose a later time or another date.');
        }
    }
}
