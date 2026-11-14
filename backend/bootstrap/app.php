<?php

use App\Http\Responses\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Lets the React app (listed in SANCTUM_STATEFUL_DOMAINS) log in with
        // secure session cookies + CSRF protection instead of storing tokens.
        $middleware->statefulApi();

        // In production, requests reach Laravel through proxies (Vercel's
        // rewrite, then Render's load balancer). Trusting them lets Laravel
        // see HTTPS and the visitor's real IP, so the per-IP rate limits in
        // AppServiceProvider count each family separately instead of
        // lumping every visitor together under the proxy's address.
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Turn every error on /api/* into the standard ApiResponse error shape.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null; // Let Laravel handle non-API errors normally.
            }

            if ($e instanceof ValidationException) {
                return ApiResponse::error($e->getMessage(), $e->status, $e->errors());
            }

            if ($e instanceof AuthenticationException) {
                return ApiResponse::error('You must be logged in to do that.', 401);
            }

            // 403, 404, 405, 419 (expired CSRF token), 429 (too many requests), ...
            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $message = match ($status) {
                    404 => 'The requested resource was not found.',
                    419 => 'Your session has expired. Please refresh the page and try again.',
                    default => $e->getMessage() ?: (Response::$statusTexts[$status] ?? 'Request failed.'),
                };

                return ApiResponse::error($message, $status, null, $e->getHeaders());
            }

            // Anything unexpected: hide the details unless APP_DEBUG=true.
            // (The full error is still written to storage/logs/laravel.log.)
            return ApiResponse::error(
                config('app.debug') ? $e->getMessage() : 'Something went wrong on the server. Please try again later.',
                500,
            );
        });
    })->create();
