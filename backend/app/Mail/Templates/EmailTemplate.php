<?php

namespace App\Mail\Templates;

/**
 * The description of one email template: what it is called, which Blade view
 * holds its content, its subject and preview text, and the variables it uses.
 * All templates are listed in EmailTemplates::definitions().
 *
 * Subject and preheader may contain placeholders such as {{booking_reference}};
 * the Blade view uses the same names as PHP variables ($booking_reference).
 */
final readonly class EmailTemplate
{
    /**
     * @param  array<string, string>  $required  variable => description; rendering fails without them
     * @param  array<string, string>  $optional  variable => description; sections using them are hidden when empty
     */
    public function __construct(
        public string $key,
        public string $name,
        public string $category,
        public string $description,
        public string $subject,
        public string $preheader,
        public array $required = [],
        public array $optional = [],
        public bool $marketing = false,
        public string $footerReason = 'You are receiving this email because of your booking or account with Kaagapay.',
        public string $trigger = '',
    ) {}

    public function view(): string
    {
        return 'emails.templates.'.$this->key;
    }

    /** @return array<int, string> */
    public function variableNames(): array
    {
        return array_keys($this->required + $this->optional);
    }

    public function usesBookingStatus(): bool
    {
        return in_array('booking_status', $this->variableNames(), true);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $variables = [];
        foreach ($this->required as $name => $description) {
            $variables[] = ['name' => $name, 'description' => $description, 'required' => true];
        }
        foreach ($this->optional as $name => $description) {
            $variables[] = ['name' => $name, 'description' => $description, 'required' => false];
        }

        return [
            'key' => $this->key,
            'name' => $this->name,
            'category' => $this->category,
            'description' => $this->description,
            'trigger' => $this->trigger,
            'subject' => $this->subject,
            'preheader' => $this->preheader,
            'marketing' => $this->marketing,
            'uses_booking_status' => $this->usesBookingStatus(),
            'variables' => $variables,
        ];
    }
}
