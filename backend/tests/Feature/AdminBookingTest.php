<?php

namespace Tests\Feature;

use App\Http\Requests\BookingRules;
use App\Models\Admin;
use App\Models\Booking;
use App\Notifications\BookingStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminBookingTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Origin', 'http://localhost:3000');
        $this->admin = Admin::factory()->create();
    }

    public function test_admin_endpoints_require_login(): void
    {
        $booking = Booking::factory()->create();

        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
        $this->getJson('/api/admin/bookings')->assertUnauthorized();
        $this->postJson('/api/admin/bookings', [])->assertUnauthorized();
        $this->getJson("/api/admin/bookings/{$booking->reference}")->assertUnauthorized();
        $this->postJson("/api/admin/bookings/{$booking->reference}/status", ['status' => 'confirmed'])->assertUnauthorized();
        $this->postJson("/api/admin/bookings/{$booking->reference}/notes", ['body' => 'x'])->assertUnauthorized();
        $this->getJson('/api/admin/clients')->assertUnauthorized();

        $this->assertSame('pending', $booking->fresh()->status);
    }

    public function test_dashboard_counts_come_from_the_database(): void
    {
        Booking::factory()->count(2)->create();
        Booking::factory()->status('confirmed')->create();
        Booking::factory()->status('cancelled')->create();
        Booking::factory()->status('completed')->onDate(Booking::now()->subDays(3)->toDateString())->create();

        $this->actingAs($this->admin)->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.counts.total', 5)
            ->assertJsonPath('data.counts.pending', 2)
            ->assertJsonPath('data.counts.confirmed', 1)
            ->assertJsonPath('data.counts.cancelled', 1)
            ->assertJsonPath('data.counts.completed', 1)
            ->assertJsonPath('data.counts.upcoming', 1)
            ->assertJsonCount(2, 'data.pending');
    }

    public function test_bookings_can_be_searched_filtered_and_paginated(): void
    {
        Booking::factory()->create(['client_name' => 'Lolo Pedro Cruz', 'contact_number' => '0917 555 1234']);
        Booking::factory()->status('confirmed')->create(['client_name' => 'Lola Nena Reyes']);
        Booking::factory()->count(20)->create();

        $this->actingAs($this->admin);

        $this->getJson('/api/admin/bookings?search=pedro')
            ->assertOk()->assertJsonCount(1, 'data.bookings')
            ->assertJsonPath('data.bookings.0.client_name', 'Lolo Pedro Cruz');

        $this->getJson('/api/admin/bookings?search=5551234')->assertJsonCount(1, 'data.bookings');

        $this->getJson('/api/admin/bookings?status=confirmed')
            ->assertJsonCount(1, 'data.bookings')
            ->assertJsonPath('data.bookings.0.client_name', 'Lola Nena Reyes');

        $this->getJson('/api/admin/bookings?per_page=10&page=3')
            ->assertJsonCount(2, 'data.bookings')
            ->assertJsonPath('data.pagination.total', 22)
            ->assertJsonPath('data.pagination.last_page', 3);

        $this->getJson('/api/admin/bookings?status=bogus&sort=password')
            ->assertStatus(422)->assertJsonValidationErrors(['status', 'sort']);
    }

    public function test_booking_details_include_private_fields_for_admins(): void
    {
        $booking = Booking::factory()->create();

        $this->actingAs($this->admin)->getJson("/api/admin/bookings/{$booking->reference}")
            ->assertOk()
            ->assertJsonPath('data.booking.emergency_contact_number', $booking->emergency_contact_number)
            ->assertJsonPath('data.booking.actions.0.status', 'confirmed');
    }

    public function test_status_workflow_and_email(): void
    {
        Notification::fake();
        $booking = Booking::factory()->create(['email' => 'family@example.com']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->reference}/status", ['status' => 'confirmed', 'notify_client' => true])
            ->assertOk()
            ->assertJsonPath('data.booking.status', 'confirmed')
            ->assertJsonPath('data.notification', 'sent');

        Notification::assertSentTo(new AnonymousNotifiable, BookingStatusChanged::class,
            fn ($notification, $channels, $notifiable) => array_key_exists('family@example.com', $notifiable->routes['mail']));

        // Confirmed → rejected is not allowed.
        $this->postJson("/api/admin/bookings/{$booking->reference}/status", ['status' => 'rejected'])
            ->assertStatus(422)->assertJsonValidationErrors(['status']);

        // Cannot complete before the start time.
        $this->postJson("/api/admin/bookings/{$booking->reference}/status", ['status' => 'completed'])
            ->assertStatus(422)->assertJsonValidationErrors(['status']);

        $this->postJson("/api/admin/bookings/{$booking->reference}/status", ['status' => 'cancelled', 'reason' => 'Family asked to cancel.'])
            ->assertOk()->assertJsonPath('data.booking.status', 'cancelled')
            ->assertJsonPath('data.notification', null);

        // Final: nothing else is possible.
        $this->postJson("/api/admin/bookings/{$booking->reference}/status", ['status' => 'confirmed'])
            ->assertStatus(422);

        $this->assertSame('cancelled', $booking->fresh()->status);
        $this->assertSame(2, $booking->activities()->where('type', 'status')->count());
        Notification::assertSentTimes(BookingStatusChanged::class, 1);
    }

    public function test_past_booking_can_be_completed_but_not_confirmed(): void
    {
        $past = Booking::factory()->onDate(Booking::now()->subDay()->toDateString())->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$past->reference}/status", ['status' => 'confirmed'])
            ->assertStatus(422);

        $past->forceFill(['status' => 'confirmed'])->save();

        $this->postJson("/api/admin/bookings/{$past->reference}/status", ['status' => 'completed'])
            ->assertOk()->assertJsonPath('data.booking.status', 'completed');
    }

    public function test_no_email_without_a_valid_address(): void
    {
        Notification::fake();
        $booking = Booking::factory()->create(['email' => null]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->reference}/status", ['status' => 'rejected', 'notify_client' => true])
            ->assertOk()->assertJsonPath('data.notification', null);

        Notification::assertNothingSent();
    }

    public function test_admin_can_create_a_booking(): void
    {
        $data = [
            'client_name' => 'Lolo Ernesto Garcia',
            'contact_person_name' => 'Maria Garcia',
            'contact_number' => '0917 222 3333',
            'email' => null,
            'emergency_contact_name' => 'Jose Garcia',
            'emergency_contact_number' => '0918 444 5555',
            'service_type' => 'appointment',
            'booking_date' => Booking::now()->addDays(2)->toDateString(),
            'start_time' => '10:00',
            'duration_hours' => 4,
            'pickup_location' => '5 Rizal Ave, Pasig',
            'destination' => 'The Medical City',
        ];

        $this->actingAs($this->admin);

        $this->postJson('/api/admin/bookings', array_merge($data, ['duration_hours' => 2]))
            ->assertStatus(422)->assertJsonValidationErrors(['duration_hours', 'agreed_to_terms']);

        $this->postJson('/api/admin/bookings', array_merge($data, ['agreed_to_terms' => true]))
            ->assertCreated()
            ->assertJsonPath('data.booking.status', 'pending')
            ->assertJsonPath('data.booking.contact_number', '0917 222 3333')
            ->assertJsonPath('data.booking.activities.0.type', 'created')
            ->assertJsonPath('data.booking.activities.0.admin_name', $this->admin->name);

        $response = $this->postJson('/api/admin/bookings', array_merge($data, ['agreed_to_terms' => true, 'confirm' => true]))
            ->assertCreated()
            ->assertJsonPath('data.booking.status', 'confirmed')
            ->assertJsonPath('data.booking.activities.0.to_status', 'confirmed');

        $this->assertMatchesRegularExpression('/^KGP-[A-Z0-9]{6}$/', $response->json('data.booking.reference'));
        $this->assertSame(2, Booking::count());
        $this->assertNotNull(Booking::latest('id')->first()->terms_accepted_at);
    }

    public function test_admin_can_edit_booking_and_add_notes(): void
    {
        $booking = Booking::factory()->create();
        $data = $booking->only(array_keys(BookingRules::fields()));
        $data['booking_date'] = $booking->booking_date->format('Y-m-d');
        $data['start_time'] = '09:00';

        $this->actingAs($this->admin)
            ->putJson("/api/admin/bookings/{$booking->reference}", array_merge($data, ['duration_hours' => 2]))
            ->assertStatus(422)->assertJsonValidationErrors(['duration_hours']);

        $this->putJson("/api/admin/bookings/{$booking->reference}", array_merge($data, [
            'duration_hours' => 5,
            'planned_activity' => 'Merienda after the walk',
        ]))
            ->assertOk()
            ->assertJsonPath('data.booking.duration_hours', 5)
            ->assertJsonPath('data.booking.planned_activity', 'Merienda after the walk')
            ->assertJsonPath('data.booking.activities.0.body', 'Updated duration, planned activity.');

        $this->postJson("/api/admin/bookings/{$booking->reference}/notes", ['body' => 'Prefers Tagalog.'])
            ->assertCreated()
            ->assertJsonPath('data.booking.activities.0.type', 'note')
            ->assertJsonPath('data.booking.activities.0.admin_name', $this->admin->name);

        $booking->forceFill(['status' => 'cancelled'])->save();
        $this->putJson("/api/admin/bookings/{$booking->reference}", $data)->assertStatus(409);
    }

    public function test_clients_are_grouped_from_bookings(): void
    {
        Booking::factory()->count(2)->create(['client_name' => 'Lola Nena Reyes', 'contact_number' => '0917 111 2222']);
        Booking::factory()->create(['client_name' => 'lola nena  reyes', 'contact_number' => '+63 917 111 2222']);
        Booking::factory()->create(['client_name' => 'Lolo Pedro Cruz']);

        $this->actingAs($this->admin);

        $response = $this->getJson('/api/admin/clients')->assertOk()->assertJsonCount(2, 'data.clients');
        $nena = collect($response->json('data.clients'))->firstWhere('total_bookings', 3);
        $this->assertNotNull($nena);

        $this->getJson('/api/admin/clients?search=pedro')->assertJsonCount(1, 'data.clients');

        $this->getJson("/api/admin/clients/{$nena['client_key']}")
            ->assertOk()
            ->assertJsonPath('data.client.total_bookings', 3)
            ->assertJsonCount(3, 'data.upcoming');

        $this->getJson('/api/admin/clients/'.str_repeat('a', 40))->assertNotFound();
    }
}
