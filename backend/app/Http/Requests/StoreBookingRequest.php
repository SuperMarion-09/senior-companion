<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreBookingRequest extends FormRequest
{
    /**
     * Anyone may request a booking; an administrator reviews it.
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
            'agreed_to_terms' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return BookingRules::messages() + [
            'agreed_to_terms.accepted' => 'Please agree to the service guidelines and booking policies.',
        ];
    }

    public function after(): array
    {
        return [
            fn (Validator $validator) => BookingRules::checkSchedule(
                $validator, $this->input('booking_date'), $this->input('start_time'),
            ),
        ];
    }
}
