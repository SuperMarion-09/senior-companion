<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Mail\Templates\EmailRenderer;
use App\Mail\Templates\EmailTemplates;
use App\Mail\Templates\EmailTheme;
use App\Mail\Templates\SampleData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

/**
 * Lets admins browse and preview every email template with sample data
 * (the "Email templates" page). Nothing is sent from here.
 */
class EmailTemplateController extends Controller
{
    /**
     * GET /api/admin/email-templates
     */
    public function index(): JsonResponse
    {
        $templates = array_map(fn ($template) => $template->toArray() + [
            'scenarios' => collect(SampleData::scenarios($template->key))
                ->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
        ], array_values(EmailTemplates::all()));

        $statuses = collect(EmailTheme::STATUSES)
            ->map(fn ($status, $key) => ['value' => $key, 'label' => $status[0]])->values();

        return ApiResponse::success([
            'templates' => $templates,
            'categories' => EmailTemplates::CATEGORIES,
            'statuses' => $statuses,
        ]);
    }

    /**
     * POST /api/admin/email-templates/{template}/preview
     * Body: { scenario?, booking_status?, data?: { variable: value } }
     */
    public function preview(Request $request, string $template, EmailRenderer $renderer): JsonResponse
    {
        if (! EmailTemplates::has($template)) {
            return ApiResponse::error('This email template does not exist.', 404);
        }

        $input = $request->validate([
            'scenario' => ['nullable', 'string', 'max:50'],
            'booking_status' => ['nullable', 'string', 'max:20'],
            'data' => ['nullable', 'array', 'max:60'],
        ]);

        $data = SampleData::forPreview(
            $template,
            $input['scenario'] ?? 'default',
            $input['booking_status'] ?? null,
            $input['data'] ?? [],
        );

        try {
            $email = $renderer->render($template, $data);
        } catch (InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 422, ['data' => [$e->getMessage()]]);
        }

        return ApiResponse::success([
            'subject' => $email->subject,
            'preheader' => $email->preheader,
            'from' => ['name' => config('mail.from.name'), 'address' => config('mail.from.address')],
            'html' => $email->html,
            'text' => $email->text,
            'size_kb' => round(strlen($email->html) / 1024, 1),
            'data' => $data,
        ]);
    }
}
