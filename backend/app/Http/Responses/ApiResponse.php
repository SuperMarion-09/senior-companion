<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

/**
 * Builds every JSON response the API sends, so the React app can always
 * rely on the same shape:
 *
 *   Success: { "success": true,  "message": "...", "data": { ... } }
 *   Error:   { "success": false, "message": "...", "errors": { ... } }
 *
 * "errors" is only included when there are field-level problems (validation).
 */
class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'OK', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * @param  array<string, array<int, string>>|null  $errors
     * @param  array<string, string>  $headers
     */
    public static function error(string $message, int $status = 400, ?array $errors = null, array $headers = []): JsonResponse
    {
        $body = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $body['errors'] = $errors;
        }

        return response()->json($body, $status, $headers);
    }
}
