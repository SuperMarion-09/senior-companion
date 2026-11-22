<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChangeBookingStatusRequest;
use App\Http\Requests\Admin\StoreBookingNoteRequest;
use App\Http\Requests\Admin\StoreBookingRequest;
use App\Http\Requests\Admin\UpdateBookingRequest;
use App\Http\Responses\ApiResponse;
use App\Models\Booking;
use App\Models\BookingActivity;
use App\Services\BookingMailer;
use App\Services\BookingStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Booking management for administrators, including entering new bookings.
 * Every route here sits behind auth:sanctum, so only logged-in admins reach it.
 */
class BookingController extends Controller
{
    // Field names as admins read them, for the "Updated: …" timeline entry.
    private const FIELD_LABELS = [
        'client_name' => 'client name',
        'contact_person_name' => 'family contact name',
        'contact_number' => 'contact number',
        'email' => 'email',
        'emergency_contact_name' => 'emergency contact name',
        'emergency_contact_number' => 'emergency contact number',
        'service_type' => 'service type',
        'booking_date' => 'booking date',
        'start_time' => 'start time',
        'duration_hours' => 'duration',
        'pickup_location' => 'pickup location',
        'destination' => 'destination',
        'planned_activity' => 'planned activity',
        'special_instructions' => 'special instructions',
    ];

    /**
     * GET /api/admin/bookings
     *
     * Query: search, status, date_from, date_to, sort (created_at|booking_date),
     * direction (asc|desc), page, per_page.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(Booking::STATUSES)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort' => ['nullable', Rule::in(['created_at', 'booking_date'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
        ], [
            'date_to.after_or_equal' => 'The "to" date must be on or after the "from" date.',
        ]);

        $sort = $filters['sort'] ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';

        $query = Booking::query()
            ->search($filters['search'] ?? null)
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['date_from'] ?? null, fn ($query, $date) => $query->whereDate('booking_date', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, $date) => $query->whereDate('booking_date', '<=', $date))
            ->orderBy($sort, $direction);

        if ($sort === 'booking_date') {
            $query->orderBy('start_time', $direction);
        }

        $page = $query->orderBy('id', $direction)->paginate($filters['per_page'] ?? 15)->withQueryString();

        return ApiResponse::success([
            'bookings' => collect($page->items())->map->toAdminListArray()->values(),
            'pagination' => self::pagination($page),
        ]);
    }

    /**
     * POST /api/admin/bookings
     *
     * A booking entered by an admin (phone call, walk-in). Saved as pending,
     * or as confirmed when `confirm` is true. With `notify_client`, the family
     * gets "request received" (pending) or the full booking confirmation.
     */
    public function store(StoreBookingRequest $request, BookingMailer $mailer): JsonResponse
    {
        $status = $request->boolean('confirm') ? Booking::STATUS_CONFIRMED : Booking::STATUS_PENDING;

        [$booking, $activity] = DB::transaction(function () use ($request, $status) {
            $booking = new Booking($request->safe()->except(['agreed_to_terms', 'confirm', 'notify_client']));
            $booking->reference = Booking::generateReference();
            $booking->status = $status;
            $booking->terms_accepted_at = now();
            $booking->save();

            $activity = $booking->activities()->create([
                'admin_id' => $request->user()->id,
                'type' => BookingActivity::TYPE_CREATED,
                'to_status' => $status,
                'body' => $status === Booking::STATUS_CONFIRMED
                    ? 'Booking entered and confirmed by an administrator.'
                    : 'Booking entered by an administrator.',
            ]);

            return [$booking, $activity];
        });

        $notification = null;
        if ($request->boolean('notify_client')) {
            $template = $status === Booking::STATUS_CONFIRMED ? 'booking-confirmation' : 'booking-request-received';
            $notification = $mailer->send($booking, $template);
            $activity->update(['notification' => $notification]);
        }

        return $this->bookingResponse(
            $booking,
            "Booking {$booking->reference} created.".self::notificationMessage($notification),
            ['notification' => $notification],
            201,
        );
    }

    /**
     * GET /api/admin/bookings/{reference}
     */
    public function show(Booking $booking): JsonResponse
    {
        return $this->bookingResponse($booking);
    }

    /**
     * PUT /api/admin/bookings/{reference}
     */
    public function update(UpdateBookingRequest $request, Booking $booking, BookingMailer $mailer): JsonResponse
    {
        if ($booking->isFinal()) {
            return ApiResponse::error("This booking is {$booking->status} and can no longer be edited.", 409);
        }

        $openedAt = $request->input('updated_at');
        if ($openedAt && $openedAt !== $booking->updated_at?->toIso8601String()) {
            return ApiResponse::error('Someone else changed this booking while you were editing. Please reload it and make your changes again.', 409);
        }

        $previousStart = $booking->startsAt();

        $booking->fill($request->safe()->except(['updated_at', 'notify_client']));
        $changed = array_keys(array_intersect_key($booking->getDirty(), self::FIELD_LABELS));

        if ($changed === []) {
            return $this->bookingResponse($booking, 'No changes to save.');
        }

        $activity = DB::transaction(function () use ($booking, $changed, $request) {
            $booking->save();

            return $booking->activities()->create([
                'admin_id' => $request->user()->id,
                'type' => BookingActivity::TYPE_UPDATE,
                'body' => 'Updated '.implode(', ', array_map(fn ($field) => self::FIELD_LABELS[$field], $changed)).'.',
            ]);
        });

        // A confirmed visit moved to another day or time: tell the family, showing old and new.
        $notification = null;
        $moved = array_intersect($changed, ['booking_date', 'start_time']) !== [];
        if ($moved && $booking->status === Booking::STATUS_CONFIRMED && $request->boolean('notify_client')) {
            $startsAt = $booking->startsAt();
            $notification = $mailer->send($booking, 'booking-rescheduled', [
                'booking_status' => 'rescheduled',
                'previous_booking_date' => $previousStart->isSameDay($startsAt) ? null : $previousStart->format('l, j F Y'),
                'previous_booking_time' => $previousStart->format('H:i') === $startsAt->format('H:i') ? null : $previousStart->format('g:i A'),
            ]);
            $activity->update(['notification' => $notification]);
        }

        return $this->bookingResponse(
            $booking,
            'Booking details saved.'.self::notificationMessage($notification),
            ['notification' => $notification],
        );
    }

    /**
     * POST /api/admin/bookings/{reference}/status
     */
    public function changeStatus(ChangeBookingStatusRequest $request, Booking $booking, BookingStatusService $service): JsonResponse
    {
        $result = $service->change(
            $booking,
            $request->user(),
            $request->input('status'),
            $request->input('reason'),
            $request->boolean('notify_client'),
        );

        $message = 'Booking marked as '.$result['booking']->status.'.'.self::notificationMessage($result['notification']);

        return $this->bookingResponse($result['booking'], $message, ['notification' => $result['notification']]);
    }

    /** What the admin is told about the email to the family, after the main message. */
    private static function notificationMessage(?string $notification): string
    {
        return match ($notification) {
            'sent' => ' The family has been emailed.',
            'failed' => ' The email to the family could not be sent, so please call them instead.',
            default => '',
        };
    }

    /**
     * POST /api/admin/bookings/{reference}/notes
     *
     * Internal notes are never shown to families. Allowed on any booking,
     * including finished ones.
     */
    public function storeNote(StoreBookingNoteRequest $request, Booking $booking): JsonResponse
    {
        $booking->activities()->create([
            'admin_id' => $request->user()->id,
            'type' => BookingActivity::TYPE_NOTE,
            'body' => $request->input('body'),
        ]);
        $booking->touch();

        return $this->bookingResponse($booking, 'Note added.', [], 201);
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function bookingResponse(Booking $booking, string $message = 'OK', array $extra = [], int $status = 200): JsonResponse
    {
        $booking->load('activities.admin');

        return ApiResponse::success(['booking' => $booking->toAdminArray()] + $extra, $message, $status);
    }

    /**
     * @return array<string, int|null>
     */
    public static function pagination($page): array
    {
        return [
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
            'total' => $page->total(),
            'from' => $page->firstItem(),
            'to' => $page->lastItem(),
        ];
    }
}
