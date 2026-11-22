@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="✅" badge="Security notice" tone="success">Your password was changed</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, this is a quick note to let you know the password for your Kaagapay account was just changed. If you did this, there is nothing else to do.</x-email.lead>

    @if ($changed_at || $request_device)
        <x-email.details title="Change details">
            <x-email.detail label="When" :value="$changed_at" />
            <x-email.detail label="Device" :value="$request_device" />
        </x-email.details>
    @endif

    <x-email.callout tone="danger" icon="⚠️" title="Was this not you?">
        Please reset your password right away and call us at {{ $brand['support_phone'] }}. We will help you secure your account.
    </x-email.callout>

    <x-email.button :href="$secure_account_url" variant="secondary">Reset my password</x-email.button>
@endsection
