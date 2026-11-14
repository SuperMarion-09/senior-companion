<?php

namespace Tests\Feature;

use App\Models\Booking;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicBookingTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'client_name' => 'Lola Remedios Santos',
            'contact_person_name' => 'Ana Santos',
            'contact_number' => '0917 123 4567',
            'email' => 'ana@example.com',
            'emergency_contact_name' => 'Ben Santos',
            'emergency_contact_number' => '0918 765 4321',
            'service_type' => 'walking',
            'booking_date' => Booking::now()->addDays(3)->toDateString(),
            'start_time' => '09:00',
            'duration_hours' => 3,
            'pickup_location' => '12 Mabini St, Quezon City',
            'destination' => 'UP Diliman Academic Oval',
            'special_instructions' => null,
            'agreed_to_terms' => true,
        ], $overrides);
    }

    public function test_family_can_request_a_booking(): void
    {
        $response = $this->postJson('/api/bookings', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.booking.status', 'pending')
            ->assertJsonPath('data.booking.client_name', 'Lola Remedios Santos')
            ->assertJsonMissingPath('data.booking.contact_number')
            ->assertJsonMissingPath('data.booking.pickup_location')
            ->assertJsonMissingPath('data.booking.emergency_contact_number');

        $this->assertMatchesRegularExpression('/^KGP-[A-Z0-9]{6}$/', $response->json('data.booking.reference'));

        $booking = Booking::firstOrFail();
        $this->assertSame('09171234567', $booking->contact_number_normalized);
        $this->assertNotNull($booking->terms_accepted_at);
        $this->assertSame(1, $booking->activities()->count());
    }

    public function test_booking_rules_are_enforced_on_the_server(): void
    {
        $this->postJson('/api/bookings', $this->payload([
            'duration_hours' => 2,
            'contact_number' => '12345',
            'service_type' => 'nursing',
            'start_time' => '22:00',
            'agreed_to_terms' => false,
        ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['duration_hours', 'contact_number', 'service_type', 'start_time', 'agreed_to_terms']);

        $this->postJson('/api/bookings', $this->payload([
            'booking_date' => Booking::now()->subDay()->toDateString(),
        ]))->assertStatus(422)->assertJsonValidationErrors(['booking_date']);

        $this->assertSame(0, Booking::count());
    }

    public function test_same_day_bookings_need_six_hours_notice(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-11-18 10:15', 'Asia/Manila'));

        try {
            $this->postJson('/api/bookings', $this->payload([
                'booking_date' => '2026-11-18',
                'start_time' => '16:00',
            ]))->assertStatus(422)->assertJsonValidationErrors(['start_time']);

            $this->postJson('/api/bookings', $this->payload([
                'booking_date' => '2026-11-18',
                'start_time' => '16:30',
            ]))->assertCreated();
        } finally {
            CarbonImmutable::setTestNow();
        }
    }

    public function test_lookup_needs_both_reference_and_phone_and_hides_private_fields(): void
    {
        $booking = Booking::factory()->create(['contact_number' => '0917 123 4567']);

        $this->postJson('/api/bookings/lookup', [
            'reference' => strtolower(str_replace('-', ' ', $booking->reference)),
            'contact_number' => '+63 917 123 4567',
        ])
            ->assertOk()
            ->assertJsonPath('data.booking.reference', $booking->reference)
            ->assertJsonMissingPath('data.booking.contact_number')
            ->assertJsonMissingPath('data.booking.email');

        $this->postJson('/api/bookings/lookup', [
            'reference' => $booking->reference,
            'contact_number' => '0917 000 0000',
        ])->assertNotFound()->assertJson(['success' => false]);
    }

    public function test_lookup_is_rate_limited(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/bookings/lookup', ['reference' => 'KGP-AAAAAA', 'contact_number' => '09171234567']);
        }

        $this->postJson('/api/bookings/lookup', ['reference' => 'KGP-AAAAAA', 'contact_number' => '09171234567'])
            ->assertStatus(429);
    }
}
