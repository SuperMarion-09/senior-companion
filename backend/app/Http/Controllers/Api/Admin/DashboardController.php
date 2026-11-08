<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Booking;
use App\Models\BookingActivity;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

/**
 * Everything on the admin dashboard, straight from the database: status
 * counts, booking trends, popular services, busiest days and the lists of
 * bookings and admin actions that need attention.
 *
 * Dates are grouped in the business time zone (config/kaagapay.php), so a
 * request sent at 7 AM in Manila counts on that Manila day, not the UTC one.
 */
class DashboardController extends Controller
{
    private const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    /** Statuses that mean the service did or will happen (used for "busiest service days"). */
    private const ACTIVE_STATUSES = [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED, Booking::STATUS_COMPLETED];

    /**
     * GET /api/admin/dashboard
     */
    public function __invoke(): JsonResponse
    {
        $now = Booking::now();

        return ApiResponse::success([
            'today' => $now->toDateString(),
            'counts' => $this->counts($now),
            'trends' => $this->trends($now),
            'services' => $this->services(),
            'weekdays' => $this->weekdays($now),
            'pending' => Booking::where('status', Booking::STATUS_PENDING)
                ->orderBy('booking_date')->orderBy('start_time')
                ->limit(5)->get()
                ->map(fn (Booking $booking) => $booking->toAdminListArray() + [
                    'email' => $booking->email,
                    'actions' => $booking->availableActions(),
                ])->values(),
            'upcoming' => Booking::upcoming()
                ->orderBy('booking_date')->orderBy('start_time')
                ->limit(6)->get()->map->toAdminListArray()->values(),
            'recent' => Booking::latest()->latest('id')
                ->limit(6)->get()->map->toAdminListArray()->values(),
            'activity' => $this->recentActivity(),
        ]);
    }

    /**
     * Bookings per status. "total" is the sum of the known statuses, so it
     * always equals the status chart; a row with an unknown status is left out.
     *
     * @return array<string, int>
     */
    private function counts(CarbonImmutable $now): array
    {
        $byStatus = Booking::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $counts = [];
        foreach (Booking::STATUSES as $status) {
            $counts[$status] = (int) ($byStatus[$status] ?? 0);
        }
        $counts['total'] = array_sum($counts);
        $counts['upcoming'] = Booking::upcoming()->count();

        // New requests this week vs the week before (rolling 7 days, business time zone).
        $weekStart = $now->startOfDay()->subDays(6);
        $counts['new_last_7_days'] = Booking::where('created_at', '>=', $weekStart->utc())->count();
        $counts['new_previous_7_days'] = Booking::where('created_at', '>=', $weekStart->subDays(7)->utc())
            ->where('created_at', '<', $weekStart->utc())->count();

        return $counts;
    }

    /**
     * Booking requests received per day (7 days), week (8 weeks, Monday to
     * Sunday) and month (6 months). The last period is the current one, so it
     * may still be filling up ("partial": true). Each series also gets the
     * total of the same-length period before it, for a fair comparison.
     *
     * @return array<string, array<string, mixed>>
     */
    private function trends(CarbonImmutable $now): array
    {
        $today = $now->startOfDay();
        $specs = [
            'daily' => [7, $today, fn (CarbonImmutable $d, int $i) => $d->subDays($i), fn (CarbonImmutable $d) => $d->addDay()],
            'weekly' => [8, $today->startOfWeek(), fn (CarbonImmutable $d, int $i) => $d->subWeeks($i), fn (CarbonImmutable $d) => $d->addWeek()],
            'monthly' => [6, $today->startOfMonth(), fn (CarbonImmutable $d, int $i) => $d->subMonths($i), fn (CarbonImmutable $d) => $d->addMonth()],
        ];

        // One query for everything: the earliest start any series (and its comparison period) needs.
        $earliest = collect($specs)->map(fn ($spec) => $spec[2]($spec[1], 2 * $spec[0] - 1))->min();
        $created = Booking::where('created_at', '>=', $earliest->utc())
            ->pluck('created_at')
            ->map(fn ($time) => CarbonImmutable::parse($time)->setTimezone($now->getTimezone()));

        $trends = [];
        foreach ($specs as $key => [$count, $current, $back, $next]) {
            $points = [];
            for ($i = $count - 1; $i >= 0; $i--) {
                $start = $back($current, $i);
                $end = $next($start);
                $points[] = [
                    'start' => $start->toDateString(),
                    'end' => $end->subDay()->toDateString(),
                    'count' => $this->countBetween($created, $start, $end),
                    'partial' => $i === 0,
                ];
            }

            $periodStart = $back($current, $count - 1);
            $trends[$key] = [
                'points' => $points,
                'total' => array_sum(array_column($points, 'count')),
                'previous_total' => $this->countBetween($created, $back($periodStart, $count), $periodStart),
            ];
        }

        return $trends;
    }

    private function countBetween(Collection $times, CarbonImmutable $start, CarbonImmutable $end): int
    {
        return $times->filter(fn (CarbonImmutable $time) => $time >= $start && $time < $end)->count();
    }

    /**
     * All bookings per service, most requested first. Every service the
     * website offers is listed, including ones nobody has booked yet.
     *
     * @return array<int, array{service_type: string, count: int}>
     */
    private function services(): array
    {
        $counts = Booking::query()
            ->whereIn('service_type', Booking::SERVICE_TYPES)
            ->whereIn('status', Booking::STATUSES)
            ->selectRaw('service_type, COUNT(*) as total')
            ->groupBy('service_type')
            ->pluck('total', 'service_type');

        return collect(Booking::SERVICE_TYPES)
            ->map(fn ($type) => ['service_type' => $type, 'count' => (int) ($counts[$type] ?? 0)])
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    /**
     * Bookings per day of the week over the last 12 months:
     * - requested: the day the family sent the request;
     * - scheduled: the day the service takes place (rejected and cancelled
     *   bookings left out, since those services never happen).
     *
     * @return array<string, mixed>
     */
    private function weekdays(CarbonImmutable $now): array
    {
        $since = $now->startOfDay()->subYear();

        $requested = Booking::where('created_at', '>=', $since->utc())
            ->pluck('created_at')
            ->map(fn ($time) => CarbonImmutable::parse($time)->setTimezone($now->getTimezone())->dayOfWeekIso);

        $scheduled = Booking::whereIn('status', self::ACTIVE_STATUSES)
            ->whereDate('booking_date', '>=', $since->toDateString())
            ->pluck('booking_date')
            ->map(fn ($date) => CarbonImmutable::parse($date)->dayOfWeekIso);

        $tally = fn (Collection $days) => collect(self::WEEKDAYS)
            ->map(fn ($name, $index) => ['day' => $name, 'count' => $days->filter(fn ($day) => $day === $index + 1)->count()])
            ->all();

        return [
            'since' => $since->toDateString(),
            'requested' => $tally($requested),
            'scheduled' => $tally($scheduled),
        ];
    }

    /**
     * The latest actions by administrators (status changes, edits, notes),
     * from the bookings' activity timelines. Nothing is made up: an empty
     * list simply means no admin has acted yet.
     *
     * @return array<int, array<string, mixed>>
     */
    private function recentActivity(): array
    {
        return BookingActivity::query()
            ->whereNotNull('admin_id')
            ->with(['admin', 'booking'])
            ->latest()->latest('id')
            ->limit(8)
            ->get()
            ->filter(fn (BookingActivity $activity) => $activity->booking !== null)
            ->map(fn (BookingActivity $activity) => $activity->toApiArray() + [
                'reference' => $activity->booking->reference,
                'client_name' => $activity->booking->client_name,
            ])
            ->values()
            ->all();
    }
}
