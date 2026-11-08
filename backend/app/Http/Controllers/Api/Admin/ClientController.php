<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Clients are worked out from bookings rather than stored separately: every
 * booking with the same senior's name and family contact number (the same
 * client_key) belongs to one client. Contact details come from their most
 * recent booking, so they stay as current as the family's last request.
 */
class ClientController extends Controller
{
    /**
     * GET /api/admin/clients?search=&page=
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $today = Booking::today();

        $grouped = Booking::query()
            ->search($filters['search'] ?? null)
            ->select('client_key')
            ->selectRaw('COUNT(*) as total_bookings')
            ->selectRaw('MAX(created_at) as last_booked_at')
            ->selectRaw(
                'SUM(CASE WHEN status IN (?, ?) AND booking_date >= ? THEN 1 ELSE 0 END) as upcoming_bookings',
                [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED, $today],
            )
            ->groupBy('client_key');

        $page = DB::query()->fromSub($grouped, 'clients')
            ->orderByDesc('last_booked_at')
            ->orderBy('client_key')
            ->paginate(15)
            ->withQueryString();

        $latest = $this->latestBookings(collect($page->items())->pluck('client_key')->all());

        $clients = collect($page->items())->map(function ($row) use ($latest) {
            $booking = $latest[$row->client_key];

            return $this->contactDetails($booking) + [
                'total_bookings' => (int) $row->total_bookings,
                'upcoming_bookings' => (int) $row->upcoming_bookings,
                'last_booked_at' => $booking->created_at?->toIso8601String(),
            ];
        })->values();

        return ApiResponse::success([
            'clients' => $clients,
            'pagination' => BookingController::pagination($page),
        ]);
    }

    /**
     * GET /api/admin/clients/{clientKey}
     */
    public function show(string $clientKey): JsonResponse
    {
        $bookings = Booking::where('client_key', $clientKey)
            ->orderByDesc('booking_date')->orderByDesc('start_time')
            ->get();

        abort_if($bookings->isEmpty(), 404);

        $today = Booking::today();
        [$upcoming, $previous] = $bookings->partition(
            fn (Booking $booking) => in_array($booking->status, [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED], true)
                && $booking->booking_date->format('Y-m-d') >= $today
        );

        $latest = $bookings->sortByDesc('created_at')->first();

        return ApiResponse::success([
            'client' => $this->contactDetails($latest) + [
                'email' => $latest->email,
                'emergency_contact_name' => $latest->emergency_contact_name,
                'emergency_contact_number' => $latest->emergency_contact_number,
                'pickup_location' => $latest->pickup_location,
                'total_bookings' => $bookings->count(),
                'completed_bookings' => $bookings->where('status', Booking::STATUS_COMPLETED)->count(),
                'first_booked_at' => $bookings->min('created_at')?->toIso8601String(),
            ],
            // Soonest first for what is coming up, most recent first for the history.
            'upcoming' => $upcoming->sortBy(fn (Booking $b) => $b->booking_date->format('Y-m-d').$b->start_time)
                ->map->toAdminListArray()->values(),
            'previous' => $previous->map->toAdminListArray()->values(),
        ]);
    }

    /**
     * The most recent booking of each client, keyed by client_key.
     *
     * @param  array<int, string>  $clientKeys
     * @return array<string, Booking>
     */
    private function latestBookings(array $clientKeys): array
    {
        return Booking::whereIn('client_key', $clientKeys)
            ->orderByDesc('created_at')->orderByDesc('id')
            ->get()
            ->unique('client_key')
            ->keyBy('client_key')
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function contactDetails(Booking $booking): array
    {
        return [
            'client_key' => $booking->client_key,
            'client_name' => $booking->client_name,
            'contact_person_name' => $booking->contact_person_name,
            'contact_number' => $booking->contact_number,
        ];
    }
}
