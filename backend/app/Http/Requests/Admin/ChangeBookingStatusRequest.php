<?php

namespace App\Http\Requests\Admin;

use App\Models\Booking;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChangeBookingStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Whether the change is allowed for this booking is checked in
     * BookingStatusService, inside a database lock.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(array_diff(Booking::STATUSES, [Booking::STATUS_PENDING]))],
            'reason' => ['nullable', 'string', 'max:1000'],
            'notify_client' => ['sometimes', 'boolean'],
        ];
    }
}
