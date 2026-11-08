<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LookupBookingRequest;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Booking;
use App\Models\BookingActivity;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Public booking endpoints used by the Kaagapay website. They only ever
 * return the public fields (Booking::toPublicArray): never phone numbers,
 * addresses or emergency contacts.
 */
class BookingController extends Controller
{
    /**
     * POST /api/bookings
     */
    public function store(StoreBookingRequest $request): JsonResponse
    {
        $booking = DB::transaction(function () use ($request) {
            $booking = new Booking($request->safe()->except('agreed_to_terms'));
            $booking->reference = Booking::generateReference();
            $booking->status = Booking::STATUS_PENDING;
            $booking->terms_accepted_at = now();
            $booking->save();

            $booking->activities()->create([
                'type' => BookingActivity::TYPE_CREATED,
                'to_status' => Booking::STATUS_PENDING,
                'body' => 'Booking request sent through the website.',
            ]);

            return $booking;
        });

        return ApiResponse::success(
            ['booking' => $booking->toPublicArray()],
            'Your booking request has been received.',
            201,
        );
    }

    /**
     * POST /api/bookings/lookup
     *
     * Shows a booking only when the reference AND the contact number match.
     * The same 404 is returned whichever one is wrong.
     */
    public function lookup(LookupBookingRequest $request): JsonResponse
    {
        $booking = Booking::where('reference', Booking::normalizeReference($request->input('reference')))
            ->where('contact_number_normalized', Phone::normalize($request->input('contact_number')))
            ->first();

        if ($booking === null) {
            return ApiResponse::error('We could not find a booking with that reference number and contact number.', 404);
        }

        return ApiResponse::success(['booking' => $booking->toPublicArray()]);
    }
}
