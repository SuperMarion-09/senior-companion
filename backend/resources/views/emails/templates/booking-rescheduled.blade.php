@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="📆" :status="$booking_status ?? 'rescheduled'">Your visit has a new date</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, {{ $senior_name ? $senior_name."'s" : 'your' }} visit is now on <strong>{{ $booking_date }} at {{ $booking_time }}</strong>. Everything else stays the same.</x-email.lead>

    @if ($reason)
        <x-email.callout tone="neutral" title="Why it changed">{{ $reason }}</x-email.callout>
    @endif

    @include('emails.partials.booking-details', ['title' => 'Updated visit'])

    <x-email.button :href="$booking_url">View my updated booking</x-email.button>

    <x-email.callout tone="warning" icon="📞" title="Does the new time not work for you?">
        Just call us at {{ $brand['support_phone'] }} and we will find another time together.
    </x-email.callout>
@endsection
