<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingActivity;
use Illuminate\Database\Seeder;

/**
 * Sample bookings for trying out the admin dashboard locally. Never run this
 * on the live site. Usage: php artisan db:seed --class=DemoBookingSeeder
 */
class DemoBookingSeeder extends Seeder
{
    public function run(): void
    {
        $families = [
            ['Lola Remedios Santos', 'Ana Santos', '0917 123 4567', 'walking'],
            ['Lolo Pedro Cruz', 'Miguel Cruz', '0918 222 3344', 'appointment'],
            ['Lola Nena Reyes', 'Carla Reyes', '0927 555 1212', 'shopping'],
            ['Lolo Ramon Dela Cruz', 'Joy Dela Cruz', '0905 777 8899', 'social'],
            ['Lola Corazon Bautista', 'Paolo Bautista', '0919 333 4455', 'errand'],
            ['Lolo Ernesto Garcia', 'Liza Garcia', '0928 812 3456', 'general'],
        ];

        // [family index, days from today, start time, status]
        $bookings = [
            [0, 2, '08:00', 'pending'], [1, 3, '09:30', 'pending'], [2, 5, '10:00', 'pending'],
            [3, 1, '14:00', 'confirmed'], [4, 4, '07:30', 'confirmed'], [0, 9, '08:00', 'confirmed'],
            [5, 0, '16:00', 'confirmed'], [1, -6, '09:00', 'completed'], [2, -12, '13:00', 'completed'],
            [0, -20, '08:00', 'completed'], [3, -3, '10:30', 'cancelled'], [4, 7, '11:00', 'rejected'],
            [5, 14, '09:00', 'pending'], [2, 21, '08:30', 'pending'], [1, -1, '15:00', 'confirmed'],
            [3, 30, '10:00', 'pending'],
        ];

        foreach ($bookings as [$family, $days, $time, $status]) {
            [$client, $contact, $phone, $service] = $families[$family];

            $booking = Booking::factory()->status($status)->create([
                'client_name' => $client,
                'contact_person_name' => $contact,
                'contact_number' => $phone,
                'email' => $family % 2 === 0 ? strtolower(strtok($contact, ' ')).'@example.com' : null,
                'service_type' => $service,
                'booking_date' => Booking::now()->addDays($days)->toDateString(),
                'start_time' => $time,
                'duration_hours' => [3, 4, 5][$family % 3],
                'pickup_location' => 'Brgy. San Antonio, Pasig City',
                'destination' => ['UP Diliman Oval', "St. Luke's Medical Center", 'SM Megamall', 'Quiapo Church', 'BDO Ortigas', 'Home'][$family],
            ]);

            $booking->activities()->create([
                'type' => BookingActivity::TYPE_CREATED,
                'to_status' => Booking::STATUS_PENDING,
                'body' => 'Booking request sent through the website.',
            ]);
        }
    }
}
