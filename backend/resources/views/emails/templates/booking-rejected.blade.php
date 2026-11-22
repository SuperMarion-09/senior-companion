@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🤍" :status="$booking_status ?? 'rejected'">We are sorry we could not arrange this visit</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, thank you for thinking of Kaagapay. Unfortunately, we are not able to provide a companion for this request{{ $senior_name ? ' for '.$senior_name : '' }}. We know this may be disappointing, and we would still love to help.</x-email.lead>

    @if ($reason)
        <x-email.callout tone="neutral" title="Why we could not accept it">{{ $reason }}</x-email.callout>
    @endif

    @include('emails.partials.booking-details', ['title' => 'The request'])

    <x-email.heading>How we can still help</x-email.heading>
    <x-email.checklist :items="[
        'Choose another date or time. Mornings on weekdays often have more companions free.',
        'Call us and we will look for the nearest available time together.',
        'No payment was taken for this request.',
    ]" />

    <x-email.button :href="$brand['booking_url']">Request another date</x-email.button>

    @include('emails.partials.need-help')
@endsection
