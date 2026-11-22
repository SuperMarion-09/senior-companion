@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="📬" :status="$booking_status ?? 'pending'">Thank you, we have your request</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, your booking request reached us safely. Our team is reviewing it now and will contact you {{ $response_time ?? 'within one business day' }} to confirm.</x-email.lead>

    @include('emails.partials.booking-details', ['title' => 'What you asked for'])

    <x-email.heading>What happens next</x-email.heading>
    <x-email.steps :steps="[
        ['title' => 'We review your request', 'text' => 'We check the date, time and the help your loved one needs.'],
        ['title' => 'We contact you', 'text' => 'We call or email to confirm the details, or to suggest another time.'],
        ['title' => 'We match a companion', 'text' => 'You will receive their name before the visit.'],
    ]" />

    <x-email.button :href="$booking_url">Check my booking status</x-email.button>

    <x-email.text muted small>Keep your reference number <strong>{{ $booking_reference }}</strong> handy. You will need it with your phone number to check your booking online.</x-email.text>

    @include('emails.partials.need-help')
@endsection
