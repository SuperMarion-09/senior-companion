<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    /**
     * GET /api/health
     *
     * Lets the frontend (or you) check that the API is running and can
     * reach the database.
     */
    public function __invoke(): JsonResponse
    {
        try {
            DB::select('SELECT 1');
        } catch (Throwable $e) {
            // Log the real error for developers, but don't reveal details publicly.
            report($e);

            return ApiResponse::error('The API is running, but it cannot connect to the database.', 503);
        }

        return ApiResponse::success([
            'status' => 'ok',
            'app' => config('app.name'),
            'database' => 'connected',
            'timestamp' => now()->toIso8601String(),
        ], 'API is healthy.');
    }
}
