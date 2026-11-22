<?php

namespace Tests\Feature;

use App\Http\Requests\BookingRules;
use App\Mail\KaagapayMail;
use App\Models\Admin;
use App\Models\Booking;
use App\Models\BookingActivity;
use App\Notifications\BookingStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Tests\TestCase;

/**
 * The emails sent automatically around a booking: request received,
 * booking confirmation, rescheduled, completed and the day-before reminder.
 */
class BookingEmailsTest extends TestCase
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
            'agreed_to_terms' => true,
        ], $overrides);
    }

    private function sentTemplate(string $template, string $to): void
    {
        Mail::assertSent(KaagapayMail::class, fn (KaagapayMail $mail) => $mail->template === $template && $mail->hasTo($to));
    }

    /* ------------------------------------------------- Request received */

    public function test_family_gets_request_received_email(): void
    {
        Mail::fake();

        $this->postJson('/api/bookings', $this->payload())->assertCreated();

        $this->sentTemplate('booking-request-received', 'ana@example.com');
        $this->assertSame('sent', BookingActivity::where('type', 'created')->value('notification'));
    }

    public function test_no_email_without_an_address(): void
    {
        Mail::fake();

        $this->postJson('/api/bookings', $this->payload(['email' => null]))->assertCreated();

        Mail::assertNothingSent();
        $this->assertNull(BookingActivity::where('type', 'created')->value('notification'));
    }

    public function test_a_mail_problem_never_loses_the_booking(): void
    {
        Mail::shouldReceive('to')->andThrow(new RuntimeException('Mail server down'));

        $this->postJson('/api/bookings', $this->payload())->assertCreated();

        $this->assertSame(1, Booking::count());
        $this->assertSame('failed', BookingActivity::where('type', 'created')->value('notification'));
    }

    /* ------------------------------------------------ Admin-entered bookings */

    public function test_admin_entered_booking_emails_only_when_asked(): void
    {
        Mail::fake();
        $this->actingAs(Admin::factory()->create());

        $this->postJson('/api/admin/bookings', $this->payload(['email' => 'one@example.com']))->assertCreated();
        Mail::assertNothingSent();

        $this->postJson('/api/admin/bookings', $this->payload(['email' => 'two@example.com', 'notify_client' => true]))
            ->assertCreated()
            ->assertJsonPath('data.notification', 'sent');
        $this->sentTemplate('booking-request-received', 'two@example.com');

        $this->postJson('/api/admin/bookings', $this->payload(['email' => 'three@example.com', 'confirm' => true, 'notify_client' => true]))
            ->assertCreated()
            ->assertJsonPath('data.booking.status', 'confirmed');
        $this->sentTemplate('booking-confirmation', 'three@example.com');
    }

    /* ---------------------------------------------------------- Rescheduled */

    public function test_moving_a_confirmed_booking_can_email_the_new_date(): void
    {
        Mail::fake();
        $this->actingAs(Admin::factory()->create());
        $booking = Booking::factory()->status('confirmed')->onDate(Booking::now()->addDays(4)->toDateString(), '09:00')->create();
        $data = $booking->only(array_keys(BookingRules::fields()));
        $data['booking_date'] = Booking::now()->addDays(5)->toDateString();
        $data['start_time'] = '09:00';

        $this->putJson("/api/admin/bookings/{$booking->reference}", $data + ['notify_client' => true])
            ->assertOk()
            ->assertJsonPath('data.notification', 'sent');

        Mail::assertSent(KaagapayMail::class, function (KaagapayMail $mail) use ($booking) {
            return $mail->template === 'booking-rescheduled'
                && $mail->data['previous_booking_date'] === Booking::now()->addDays(4)->format('l, j F Y')
                && $mail->data['previous_booking_time'] === null
                && $mail->hasTo($booking->email);
        });
    }

    public function test_no_rescheduled_email_for_other_edits_or_pending_bookings(): void
    {
        Mail::fake();
        $this->actingAs(Admin::factory()->create());

        $confirmed = Booking::factory()->status('confirmed')->create();
        $data = $confirmed->only(array_keys(BookingRules::fields()));
        $data['booking_date'] = $confirmed->booking_date->format('Y-m-d');
        $data['start_time'] = '09:00';
        $this->putJson("/api/admin/bookings/{$confirmed->reference}", ['duration_hours' => 5] + $data + ['notify_client' => true])->assertOk();

        $pending = Booking::factory()->create();
        $data = $pending->only(array_keys(BookingRules::fields()));
        $data['booking_date'] = $pending->booking_date->format('Y-m-d');
        $this->putJson("/api/admin/bookings/{$pending->reference}", ['start_time' => '10:00'] + $data + ['notify_client' => true])->assertOk();

        Mail::assertNothingSent();
    }

    /* ------------------------------------------------------------ Completed */

    public function test_completing_a_visit_can_email_the_family(): void
    {
        Notification::fake();
        $booking = Booking::factory()->status('confirmed')->onDate(Booking::now()->subDay()->toDateString())->create();

        $this->actingAs(Admin::factory()->create())
            ->postJson("/api/admin/bookings/{$booking->reference}/status", [
                'status' => 'completed',
                'reason' => 'Lola enjoyed the walk.',
                'notify_client' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.notification', 'sent');

        Notification::assertSentTo(new AnonymousNotifiable, BookingStatusChanged::class, function ($notification, $channels, $notifiable) {
            $mail = $notification->toMail($notifiable);

            return $mail->template === 'service-completed' && $mail->data['visit_summary'] === 'Lola enjoyed the walk.';
        });
    }

    /* ------------------------------------------------------------- Reminder */

    public function test_reminders_go_once_to_confirmed_visits_tomorrow(): void
    {
        Mail::fake();
        $tomorrow = Booking::now()->addDay()->toDateString();

        $due = Booking::factory()->status('confirmed')->onDate($tomorrow)->create(['email' => 'due@example.com']);
        Booking::factory()->onDate($tomorrow)->create(['email' => 'pending@example.com']);
        Booking::factory()->status('confirmed')->onDate($tomorrow)->create(['email' => null]);
        Booking::factory()->status('confirmed')->onDate(Booking::now()->addDays(2)->toDateString())->create(['email' => 'later@example.com']);

        $this->artisan('bookings:send-reminders --dry-run')->assertSuccessful();
        Mail::assertNothingSent();

        $this->artisan('bookings:send-reminders')->expectsOutputToContain('1 reminder(s) sent')->assertSuccessful();
        $this->artisan('bookings:send-reminders')->expectsOutputToContain('No reminders to send')->assertSuccessful();

        Mail::assertSentCount(1);
        $this->sentTemplate('booking-reminder', 'due@example.com');
        $this->assertSame('sent', $due->activities()->where('type', 'reminder')->value('notification'));
    }
}
