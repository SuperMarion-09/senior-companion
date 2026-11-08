<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // At most 5 login attempts per minute for each email + IP address.
        RateLimiter::for('login', function (Request $request) {
            $email = $request->input('email');

            return Limit::perMinute(5)->by(strtolower(is_string($email) ? $email : '').'|'.$request->ip());
        });

        // New booking requests: 10 per hour for each IP address, against spam.
        RateLimiter::for('bookings', function (Request $request) {
            return Limit::perHour(10)->by($request->ip());
        });

        // Booking lookups: 10 per minute for each IP address, so references
        // and phone numbers cannot be guessed.
        RateLimiter::for('booking-lookup', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Password rules for admin accounts (used by `php artisan admin:create`).
        Password::defaults(fn () => Password::min(12)->letters()->mixedCase()->numbers());
    }
}
