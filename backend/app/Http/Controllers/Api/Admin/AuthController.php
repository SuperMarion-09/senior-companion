<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Admin login using Laravel's session authentication (through Sanctum).
 *
 * The React app first calls GET /sanctum/csrf-cookie, then POST /api/admin/login.
 * After that the browser's session cookie identifies the admin on every request.
 */
class AuthController extends Controller
{
    /**
     * POST /api/admin/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::guard('web')->attempt($credentials)) {
            // Same message for "unknown email" and "wrong password", so attackers
            // can't discover which emails have accounts.
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        // Issue a new session id after login to prevent session fixation.
        $request->session()->regenerate();

        $admin = Auth::guard('web')->user();
        $admin->forceFill(['last_login_at' => now()])->save();

        return ApiResponse::success(['admin' => $admin->toApiArray()], 'Logged in successfully.');
    }

    /**
     * GET /api/admin/me
     */
    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(['admin' => $request->user()->toApiArray()]);
    }

    /**
     * POST /api/admin/logout
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::success(null, 'Logged out successfully.');
    }
}
