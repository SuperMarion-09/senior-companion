<?php

use App\Mail\KaagapayMail;
use App\Mail\Templates\EmailTemplates;
use App\Mail\Templates\SampleData;
use App\Models\Admin;
use App\Models\Booking;
use App\Models\BookingActivity;
use App\Services\BookingMailer;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

// Usage: php artisan admin:create
Artisan::command('admin:create', function () {
    $data = [
        'name' => text(label: 'Admin name', required: true),
        'email' => text(label: 'Admin email', required: true),
        'password' => password(label: 'Password', required: true, hint: 'At least 12 characters, with upper and lower case letters and a number.'),
    ];
    $data['password_confirmation'] = password(label: 'Confirm password', required: true);

    $validator = Validator::make($data, [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'string', 'email', 'max:255', 'unique:admins,email'],
        'password' => ['required', 'confirmed', Password::defaults()],
    ]);

    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) {
            $this->error($error);
        }

        return 1;
    }

    $admin = Admin::create($validator->safe()->only(['name', 'email', 'password']));

    $this->info("Admin account created for {$admin->email}.");

    return 0;
})->purpose('Create a new administrator account');

// Usage: php artisan email:test booking-reminder you@example.com --scenario=today
// Sends one template with sample data through the configured mailer, so you
// can check how it looks in Gmail, Outlook or Apple Mail.
Artisan::command('email:test {template : Template key, e.g. booking-approved} {to : Email address to send to} {--scenario=default : Sample data scenario} {--status= : Booking status to show}', function () {
    $key = $this->argument('template');

    if (! EmailTemplates::has($key)) {
        $this->error("Unknown template [{$key}]. Choose one of: ".implode(', ', array_keys(EmailTemplates::all())));

        return 1;
    }

    if (! filter_var($this->argument('to'), FILTER_VALIDATE_EMAIL)) {
        $this->error('Please give a valid email address.');

        return 1;
    }

    $data = SampleData::forPreview($key, $this->option('scenario'), $this->option('status'));
    Mail::to($this->argument('to'))->send(new KaagapayMail($key, $data));

    $this->info("Sent \"{$key}\" to {$this->argument('to')} using the \"".config('mail.default').'" mailer.');

    return 0;
})->purpose('Send a sample email template to yourself');

// Usage: php artisan bookings:send-reminders [--dry-run]
// Emails a reminder to every family with a confirmed visit tomorrow (Philippine
// time). Each booking gets at most one reminder: a sent one is recorded on the
// booking timeline, so running the command again does not repeat it, and a
// failed one is tried again on the next run.
Artisan::command('bookings:send-reminders {--dry-run : List who would be emailed without sending}', function (BookingMailer $mailer) {
    $tomorrow = Booking::now()->addDay();

    $bookings = Booking::query()
        ->where('status', Booking::STATUS_CONFIRMED)
        ->whereDate('booking_date', $tomorrow->toDateString())
        ->whereNotNull('email')
        ->whereDoesntHave('activities', fn ($query) => $query
            ->where('type', BookingActivity::TYPE_REMINDER)
            ->where('notification', 'sent'))
        ->orderBy('start_time')
        ->get()
        ->filter(fn (Booking $booking) => $mailer->canEmail($booking));

    if ($bookings->isEmpty()) {
        $this->info('No reminders to send for '.$tomorrow->format('l, j F Y').'.');

        return 0;
    }

    $failed = 0;
    foreach ($bookings as $booking) {
        if ($this->option('dry-run')) {
            $this->line("Would remind {$booking->reference} ({$booking->email})");

            continue;
        }

        $result = $mailer->send($booking, 'booking-reminder', ['reminder_when' => 'tomorrow']);
        $booking->activities()->create([
            'type' => BookingActivity::TYPE_REMINDER,
            'body' => 'Automatic reminder for the visit tomorrow.',
            'notification' => $result,
        ]);

        $failed += $result === 'failed' ? 1 : 0;
        $this->line(($result === 'sent' ? 'Sent' : 'FAILED')." {$booking->reference} ({$booking->email})");
    }

    if ($this->option('dry-run')) {
        $this->info("{$bookings->count()} reminder(s) would be sent. Nothing was sent.");

        return 0;
    }

    $this->info(($bookings->count() - $failed)." reminder(s) sent, {$failed} failed.");

    return $failed > 0 ? 1 : 0;
})->purpose('Email families a reminder the day before a confirmed visit');

// Runs only where `php artisan schedule:run` is called every minute (cron).
// See docs/EMAIL_TEMPLATES.md, section 7.
Schedule::command('bookings:send-reminders')
    ->dailyAt('17:00')
    ->timezone(config('kaagapay.timezone'));
