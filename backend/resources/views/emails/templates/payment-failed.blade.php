@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="💳" badge="Payment not completed" tone="warning">Your payment did not go through</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, we tried to process your payment of <strong>{{ $total_amount }}</strong>, but it was not successful. Do not worry: <strong>no money was taken</strong>, and this happens to many people.</x-email.lead>

    @if ($failure_reason)
        <x-email.callout tone="warning" title="What happened">{{ $failure_reason }}</x-email.callout>
    @endif

    <x-email.details title="Payment details">
        <x-email.detail label="Amount" :value="$total_amount" />
        <x-email.detail label="Payment method" :value="$payment_method" />
        <x-email.detail label="For booking" :value="$booking_reference" mono />
        <x-email.detail label="Service" :value="$service_name" />
        <x-email.detail label="Visit date" :value="$booking_date ? trim($booking_date.($booking_time ? ', '.$booking_time : '')) : null" />
    </x-email.details>

    <x-email.heading>How to fix it</x-email.heading>
    <x-email.steps :steps="[
        ['title' => 'Check your card or e-wallet', 'text' => 'Make sure it has enough balance and has not expired.'],
        ['title' => 'Try again', 'text' => 'Tap the button below. It only takes a minute.'],
        ['title' => 'Or pay another way', 'text' => 'Call us and we will help you choose another payment method.'],
    ]" />

    <x-email.button :href="$retry_url">Try my payment again</x-email.button>

    @if ($retry_deadline)
        <x-email.text muted small>We are holding your booking until <strong>{{ $retry_deadline }}</strong>. After that, the time may be offered to another family.</x-email.text>
    @endif

    @include('emails.partials.need-help')
@endsection
