<?php

namespace App\Mail\Templates;

/**
 * A finished email, ready to send or preview.
 */
final readonly class RenderedEmail
{
    /**
     * @param  array<string, mixed>  $data  the variables the email was rendered with
     */
    public function __construct(
        public EmailTemplate $template,
        public string $subject,
        public string $preheader,
        public string $html,
        public string $text,
        public array $data,
    ) {}
}
