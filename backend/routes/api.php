<?php

use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

/*
| API routes. Everything in this file is automatically prefixed with /api,
| so '/health' below is reached at http://localhost:8000/api/health
*/

Route::get('/health', HealthController::class)->name('health');

Route::prefix('admin')->name('admin.')->group(function () {
    // "throttle:login" limits login attempts (see AppServiceProvider).
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:login')
        ->name('login');

    // Routes below require a logged-in admin.
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    });
});
