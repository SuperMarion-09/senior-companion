<?php

use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Api\Admin\ClientController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

/*
| API routes. Everything in this file is automatically prefixed with /api,
| so '/health' below is reached at http://localhost:8000/api/health
*/

Route::get('/health', HealthController::class)->name('health');

// Public booking endpoints for the website (rate limits: see AppServiceProvider).
Route::post('/bookings', [BookingController::class, 'store'])
    ->middleware('throttle:bookings')
    ->name('bookings.store');
Route::post('/bookings/lookup', [BookingController::class, 'lookup'])
    ->middleware('throttle:booking-lookup')
    ->name('bookings.lookup');

Route::prefix('admin')->name('admin.')->group(function () {
    // "throttle:login" limits login attempts (see AppServiceProvider).
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:login')
        ->name('login');

    // Routes below require a logged-in admin.
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        Route::get('/bookings', [AdminBookingController::class, 'index'])->name('bookings.index');
        Route::get('/bookings/{booking:reference}', [AdminBookingController::class, 'show'])->name('bookings.show');
        Route::put('/bookings/{booking:reference}', [AdminBookingController::class, 'update'])->name('bookings.update');
        Route::post('/bookings/{booking:reference}/status', [AdminBookingController::class, 'changeStatus'])->name('bookings.status');
        Route::post('/bookings/{booking:reference}/notes', [AdminBookingController::class, 'storeNote'])->name('bookings.notes');

        Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
        Route::get('/clients/{clientKey}', [ClientController::class, 'show'])
            ->where('clientKey', '[0-9a-f]{40}')
            ->name('clients.show');
    });
});
