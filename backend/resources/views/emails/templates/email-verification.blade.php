@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="✉️">Please confirm your email address</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, thank you for joining Kaagapay. Please confirm this is your email address, so we can send your booking updates safely.</x-email.lead>

    <x-email.button :href="$verification_link" fallback>Confirm my email address</x-email.button>

    @if ($verification_code)
        <x-email.text muted small>Or type this code on the Kaagapay website:</x-email.text>
        <x-email.code :code="$verification_code" label="Confirmation code" />
    @endif

    <x-email.callout tone="neutral" icon="🔒">
        @if ($link_expires_in)
            For your safety, this link works for {{ $link_expires_in }}.
        @endif
        If you did not create a Kaagapay account, you can ignore this email. Nothing will change.
    </x-email.callout>
@endsection
