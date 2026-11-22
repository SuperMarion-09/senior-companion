<?php

namespace App\Mail\Templates;

use Illuminate\Support\Facades\View;
use InvalidArgumentException;

/**
 * Turns a template key plus data into a finished email: subject, inbox
 * preview text, HTML and a plain-text version. Used by KaagapayMail (real
 * emails), the admin preview API and the /email-previews page, so what you
 * preview is exactly what is sent.
 */
final class EmailRenderer
{
    /**
     * @param  array<string, mixed>  $data  template variables, e.g. ['customer_name' => 'Ana']
     *
     * @throws InvalidArgumentException when the template is unknown or a required variable is missing
     */
    public function render(string $key, array $data = []): RenderedEmail
    {
        $template = EmailTemplates::find($key);
        $variables = $this->variables($template, $data);

        $missing = array_filter(array_keys($template->required), fn ($name) => blank($variables[$name] ?? null));
        if ($missing !== []) {
            throw new InvalidArgumentException(
                "Email template [{$key}] is missing required data: ".implode(', ', $missing).'.'
            );
        }

        $subject = self::interpolate($template->subject, $variables);
        $preheader = self::interpolate($template->preheader, $variables);

        $html = View::make($template->view(), $variables + [
            'brand' => self::brand(),
            'meta' => [
                'template' => $template->key,
                'subject' => $subject,
                'preheader' => $preheader,
                'marketing' => $template->marketing,
                'footer_reason' => $template->footerReason,
                'unsubscribe_url' => $variables['unsubscribe_url'] ?? null,
            ],
        ])->render();

        return new RenderedEmail($template, $subject, $preheader, $html, HtmlToText::convert($html), $variables);
    }

    /**
     * Brand values shared by the layout and every template, from config/kaagapay.php.
     *
     * @return array<string, string>
     */
    public static function brand(): array
    {
        $email = config('kaagapay.email');

        return [
            'name' => $email['platform_name'],
            'tagline' => $email['tagline'],
            'website_url' => $email['website_url'],
            'website_label' => preg_replace('#^https?://#', '', $email['website_url']),
            'booking_url' => $email['booking_url'],
            'booking_status_url' => $email['booking_status_url'],
            'privacy_url' => $email['privacy_url'],
            'terms_url' => $email['terms_url'],
            'support_email' => config('kaagapay.contact_email'),
            'support_phone' => config('kaagapay.contact_phone'),
            'support_phone_href' => 'tel:'.preg_replace('/[^0-9+]/', '', (string) config('kaagapay.contact_phone')),
            'support_hours' => $email['support_hours'],
            'address' => $email['address'],
            'signature_name' => $email['signature_name'],
            'logo_url' => $email['asset_url'].'/kaagapay-logo-horizontal-white@2x.png',
            'logo_footer_url' => $email['asset_url'].'/kaagapay-logo-horizontal-reversed@2x.png',
            'mark_url' => $email['asset_url'].'/kaagapay-mark@2x.png',
            'year' => (string) now(config('kaagapay.timezone'))->year,
        ];
    }

    /**
     * Replaces {{name}} and {{name|fallback}} in subjects and preview texts.
     *
     * @param  array<string, mixed>  $variables
     */
    public static function interpolate(string $text, array $variables): string
    {
        $result = preg_replace_callback('/\{\{\s*([a-z0-9_]+)\s*(?:\|([^}]*))?\}\}/i', function (array $match) use ($variables) {
            $value = $variables[$match[1]] ?? null;

            return is_scalar($value) && trim((string) $value) !== '' ? trim((string) $value) : trim($match[2] ?? '');
        }, $text);

        return trim(preg_replace('/\s+/', ' ', $result));
    }

    /**
     * Every declared variable exists (as null when not given), plus the
     * platform values, so templates can simply write @if ($companion_name).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function variables(EmailTemplate $template, array $data): array
    {
        $brand = self::brand();
        $defaults = array_fill_keys($template->variableNames(), null);

        $platform = [
            'platform_name' => $brand['name'],
            'support_email' => $brand['support_email'],
            'support_phone' => $brand['support_phone'],
            'website_url' => $brand['website_url'],
        ];

        $data = array_diff_key($data, array_flip(EmailTemplates::RESERVED));

        // Empty strings count as "not given", so optional sections stay hidden.
        $data = array_map(fn ($value) => is_string($value) && trim($value) === '' ? null : $value, $data);

        return array_merge($defaults, $platform, $data);
    }
}
