@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🔑">Let's set a new password</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, we received a request to reset the password for your Kaagapay account. Tap the button below to choose a new one.</x-email.lead>

    <x-email.button :href="$reset_password_link" fallback>Choose a new password</x-email.button>

    @if ($request_device || $request_time)
        <x-email.details title="About this request">
            <x-email.detail label="Requested" :value="$request_time" />
            <x-email.detail label="From" :value="$request_device" />
        </x-email.details>
    @endif

    <x-email.callout tone="warning" icon="🛡️" title="Did not ask for this?">
        You can safely ignore this email. Your password stays the same and no one can change it without this link.
        @if ($link_expires_in)
            The link stops working after {{ $link_expires_in }}.
        @endif
    </x-email.callout>

    <x-email.text muted small>Kaagapay will never ask for your password by phone, text or email.</x-email.text>
@endsection
