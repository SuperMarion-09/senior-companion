@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="💬" badge="Message received" tone="success">Thank you for reaching out</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, we received your message and a real person from our team will reply {{ $response_time ?? 'within one business day' }}. You do not need to send it again.</x-email.lead>

    <x-email.details :reference="$ticket_reference" reference-label="Request number">
        <x-email.detail label="About" :value="$request_subject" />
        <x-email.detail label="Your message" :value="$request_message ? \Illuminate\Support\Str::limit($request_message, 400) : null" />
    </x-email.details>

    <x-email.button :href="$request_url" variant="secondary">View my request</x-email.button>

    <x-email.callout tone="warning" icon="📞" title="Is it urgent?">
        For changes to a visit today or tomorrow, please call us at {{ $brand['support_phone'] }}. In an emergency, always call 911 first.
    </x-email.callout>
@endsection
