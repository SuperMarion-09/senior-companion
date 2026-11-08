<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Booking;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Origin', 'http://localhost:3000');
        $this->admin = Admin::factory()->create();
        // Wednesday 18 November 2026, 10:00 in Manila (02:00 UTC).
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-11-18 10:00', 'Asia/Manila'));
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    /** A booking whose request was sent at a given Manila time. */
    private function requestedAt(string $manilaTime, array $attributes = []): Booking
    {
        $booking = Booking::factory()->create($attributes + ['booking_date' => '2026-11-25']);
        $booking->forceFill(['created_at' => CarbonImmutable::parse($manilaTime, 'Asia/Manila')->utc()])->saveQuietly();

        return $booking;
    }

    public function test_dashboard_requires_login(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
    }

    public function test_trends_are_grouped_by_manila_day_week_and_month(): void
    {
        $this->requestedAt('2026-11-18 08:00');           // today
        $this->requestedAt('2026-11-17 07:30');           // yesterday, 23:30 UTC the day before
        $this->requestedAt('2026-11-17 20:00');           // yesterday
        $this->requestedAt('2026-11-09 09:00');           // last week (Monday)
        $this->requestedAt('2026-11-08 09:00');           // previous 7 days window
        $this->requestedAt('2026-09-02 09:00');           // September

        $response = $this->actingAs($this->admin)->getJson('/api/admin/dashboard')->assertOk();

        $daily = $response->json('data.trends.daily');
        $this->assertCount(7, $daily['points']);
        $this->assertSame('2026-11-12', $daily['points'][0]['start']);
        $this->assertSame(['2026-11-17', 2], [$daily['points'][5]['start'], $daily['points'][5]['count']]);
        $this->assertSame(['2026-11-18', 1, true], [$daily['points'][6]['start'], $daily['points'][6]['count'], $daily['points'][6]['partial']]);
        $this->assertSame(3, $daily['total']);
        $this->assertSame(2, $daily['previous_total']); // 8 and 9 November

        $weekly = $response->json('data.trends.weekly');
        $this->assertCount(8, $weekly['points']);
        $this->assertSame('2026-11-16', $weekly['points'][7]['start']); // weeks start on Monday
        $this->assertSame(3, $weekly['points'][7]['count']);
        $this->assertSame(1, $weekly['points'][6]['count']); // 9 Nov (the 8th is a Sunday, the week before)

        $monthly = $response->json('data.trends.monthly');
        $this->assertSame(['2026-06-01', '2026-11-01'], [$monthly['points'][0]['start'], $monthly['points'][5]['start']]);
        $this->assertSame(5, $monthly['points'][5]['count']);
        $this->assertSame(1, $monthly['points'][3]['count']);
        $this->assertSame(6, $monthly['total']);

        $this->assertSame(3, $response->json('data.counts.new_last_7_days'));
        $this->assertSame(2, $response->json('data.counts.new_previous_7_days'));
    }

    public function test_chart_totals_match_the_summary_counts(): void
    {
        Booking::factory()->count(3)->create(['service_type' => 'walking']);
        Booking::factory()->status('confirmed')->create(['service_type' => 'errand']);
        Booking::factory()->status('rejected')->create(['service_type' => 'walking']);
        Booking::factory()->status('cancelled')->create(['service_type' => 'social']);

        $data = $this->actingAs($this->admin)->getJson('/api/admin/dashboard')->assertOk()->json('data');

        $statusSum = collect(Booking::STATUSES)->sum(fn ($status) => $data['counts'][$status]);
        $this->assertSame(6, $data['counts']['total']);
        $this->assertSame($data['counts']['total'], $statusSum);
        $this->assertSame($data['counts']['total'], collect($data['services'])->sum('count'));

        // Every offered service is listed, most requested first.
        $this->assertCount(count(Booking::SERVICE_TYPES), $data['services']);
        $this->assertSame(['walking', 4], [$data['services'][0]['service_type'], $data['services'][0]['count']]);
    }

    public function test_weekday_counts_and_recent_admin_activity(): void
    {
        $booking = $this->requestedAt('2026-11-17 07:30', ['booking_date' => '2026-11-21']); // requested Tue, for a Saturday
        $this->requestedAt('2026-11-16 09:00', ['booking_date' => '2026-11-21'])
            ->forceFill(['status' => 'rejected'])->saveQuietly();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->reference}/status", ['status' => 'confirmed'])
            ->assertOk();

        $data = $this->getJson('/api/admin/dashboard')->assertOk()->json('data');

        $requested = collect($data['weekdays']['requested'])->pluck('count', 'day');
        $this->assertSame(1, $requested['Tuesday']);
        $this->assertSame(1, $requested['Monday']);

        // The rejected booking's service never happens, so it is not counted.
        $scheduled = collect($data['weekdays']['scheduled'])->pluck('count', 'day');
        $this->assertSame(1, $scheduled['Saturday']);

        // Only admin actions; the "requested by the family" entries are not listed.
        $this->assertCount(1, $data['activity']);
        $this->assertSame('confirmed', $data['activity'][0]['to_status']);
        $this->assertSame($booking->reference, $data['activity'][0]['reference']);
        $this->assertSame($this->admin->name, $data['activity'][0]['admin_name']);
    }

    public function test_empty_database_gives_zeros_not_errors(): void
    {
        $data = $this->actingAs($this->admin)->getJson('/api/admin/dashboard')->assertOk()->json('data');

        $this->assertSame(0, $data['counts']['total']);
        $this->assertSame(0, $data['trends']['weekly']['total']);
        $this->assertSame([], $data['activity']);
        $this->assertSame([], $data['recent']);
    }
}
