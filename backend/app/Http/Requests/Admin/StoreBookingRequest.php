<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\BookingRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * A booking entered by an administrator, e.g. taken over the phone or at
 * the office. Same rules as the public booking form.
 */
class StoreBookingRequest extends FormRequest
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
            // The admin confirms the family agreed to the guidelines and policies.
            'agreed_to_terms' => ['accepted'],
            // Save it as confirmed straight away instead of pending.
            'confirm' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return BookingRules::messages() + [
            'agreed_to_terms.accepted' => 'Please confirm the family has agreed to the service guidelines and booking policies.',
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
