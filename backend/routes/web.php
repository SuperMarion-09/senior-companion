<?php

use Illuminate\Support\Facades\Route;

// The backend is an API only; the website itself is the React app.
Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'message' => 'Senior Companion API. Check GET /api/health to verify it is running.',
    ]);
});
