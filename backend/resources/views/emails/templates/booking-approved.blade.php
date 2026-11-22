@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🎉" :status="$booking_status ?? 'confirmed'">
        Good news! {{ $senior_name ? $senior_name."'s" : 'Your' }} visit is confirmed
    </x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, we are happy to let you know that your booking request has been approved. {{ $companion_name ?: 'Your companion' }} will arrive at the agreed time and place.</x-email.lead>

    @if ($admin_note)
        <x-email.quote author="The Kaagapay team">{{ $admin_note }}</x-email.quote>
    @endif

    @include('emails.partials.booking-details', ['title' => 'Your visit'])

    <x-email.button :href="$booking_url">View my booking</x-email.button>

    <x-email.callout tone="info" icon="💡" title="Good to know">
        Kaagapay provides non-medical companionship only. Transportation, parking and other expenses are paid separately. Extending the visit on the day needs our approval.
    </x-email.callout>

    @include('emails.partials.need-help')
@endsection
