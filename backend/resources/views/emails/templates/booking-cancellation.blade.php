@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🗓️" :status="$booking_status ?? 'cancelled'">Your booking has been cancelled</x-email.hero>

    <x-email.lead>
        Hello {{ $customer_name }},
        @if ($cancelled_by === 'family')
            as you asked, we have cancelled the visit below.
        @elseif ($cancelled_by === 'kaagapay')
            we are sorry to let you know that we had to cancel the visit below.
        @else
            this is to confirm that the visit below has been cancelled.
        @endif
        You do not need to do anything else.
    </x-email.lead>

    @if ($reason)
        <x-email.callout tone="neutral" title="Reason">{{ $reason }}</x-email.callout>
    @endif

    @include('emails.partials.booking-details', ['title' => 'Cancelled visit', 'showCompanion' => false])

    @if ($refund_note)
        <x-email.callout tone="info" icon="💳" title="About your payment">{{ $refund_note }}</x-email.callout>
    @endif

    <x-email.text>Whenever you are ready, we would be glad to arrange another visit.</x-email.text>

    <x-email.button :href="$brand['booking_url']">Book another visit</x-email.button>

    @include('emails.partials.need-help')
@endsection
