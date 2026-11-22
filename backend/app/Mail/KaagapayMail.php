<?php

namespace App\Mail;

use App\Mail\Templates\EmailRenderer;
use App\Mail\Templates\RenderedEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\HtmlString;

/**
 * Sends any Kaagapay email template:
 *
 *   Mail::to($email)->send(new KaagapayMail('booking-reminder', [...]));
 *
 * or, from a notification's toMail(), return it with ->to(...) set.
 * Template keys and their variables: App\Mail\Templates\EmailTemplates.
 */
class KaagapayMail extends Mailable
{
    use Queueable, SerializesModels;

    private ?RenderedEmail $rendered = null;

    /**
     * @param  array<string, mixed>  $data  template variables (strings, or lists for e.g. line_items)
     */
    public function __construct(
        public string $template,
        public array $data = [],
    ) {}

    public function rendered(): RenderedEmail
    {
        return $this->rendered ??= app(EmailRenderer::class)->render($this->template, $this->data);
    }

    public function envelope(): Envelope
    {
        $support = config('kaagapay.contact_email');

        return new Envelope(
            subject: $this->rendered()->subject,
            // "Just reply to this email" reaches the team, even when sent from a no-reply address.
            replyTo: filter_var($support, FILTER_VALIDATE_EMAIL) ? [new Address($support, config('kaagapay.email.platform_name'))] : [],
            tags: ['kaagapay', $this->template],
            metadata: ['template' => $this->template],
        );
    }

    /**
     * Marketing emails carry one-click unsubscribe headers (Gmail and Yahoo
     * require them for bulk senders).
     */
    public function headers(): Headers
    {
        $rendered = $this->rendered();
        $unsubscribe = $rendered->data['unsubscribe_url'] ?? null;

        if (! $rendered->template->marketing || ! $unsubscribe) {
            return new Headers;
        }

        return new Headers(text: [
            'List-Unsubscribe' => "<{$unsubscribe}>",
            'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
        ]);
    }

    /**
     * HTML and plain text are both rendered from the one template.
     *
     * @return array<string, mixed>
     */
    protected function buildView()
    {
        return [
            'html' => new HtmlString($this->rendered()->html),
            'raw' => $this->rendered()->text,
        ];
    }
}
