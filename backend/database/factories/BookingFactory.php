<?php

namespace Database\Factories;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Creates fake bookings for automated tests.
 *
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_name' => fake()->name(),
            'contact_person_name' => fake()->name(),
            'contact_number' => '0917'.fake()->unique()->numerify('#######'),
            'email' => fake()->safeEmail(),
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_number' => '0918'.fake()->numerify('#######'),
            'service_type' => fake()->randomElement(Booking::SERVICE_TYPES),
            'booking_date' => Booking::now()->addDays(fake()->numberBetween(2, 60))->toDateString(),
            'start_time' => '09:00',
            'duration_hours' => 3,
            'pickup_location' => fake()->streetAddress(),
            'destination' => fake()->city(),
            'special_instructions' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Booking $booking) {
            $booking->reference ??= Booking::generateReference();
            $booking->status ??= Booking::STATUS_PENDING;
            $booking->terms_accepted_at ??= now();
        });
    }

    public function status(string $status): static
    {
        return $this->afterMaking(fn (Booking $booking) => $booking->status = $status);
    }

    public function onDate(string $date, string $time = '09:00'): static
    {
        return $this->state(['booking_date' => $date, 'start_time' => $time]);
    }
}
