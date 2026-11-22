@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="⏰" badge="Visit {{ $reminder_when }}" tone="clay">
        See you {{ $reminder_when }}, {{ $customer_name }}!
    </x-email.hero>

    <x-email.lead>This is a friendly reminder that {{ $senior_name ? $senior_name."'s" : 'your' }} companion visit is coming up {{ $reminder_when }} at <strong>{{ $booking_time }}</strong>. {{ $companion_name ? $companion_name.' is looking forward to it.' : '' }}</x-email.lead>

    @include('emails.partials.booking-details', ['title' => 'Your visit'])

    <x-email.heading>A quick checklist</x-email.heading>
    <x-email.checklist :items="[
        'Be ready a few minutes before ' . $booking_time . ' at the meeting place.',
        'Bring an ID, any cards needed and money for expenses.',
        'Wear comfortable shoes and bring water, an umbrella or a jacket.',
        'Keep your phone charged so we can reach you.',
    ]" />

    <x-email.button :href="$booking_url">View my booking</x-email.button>

    <x-email.callout tone="warning" icon="📞" title="Need to cancel or change the time?">
        Please call us as early as possible at {{ $brand['support_phone'] }}, so we can let your companion know.
    </x-email.callout>
@endsection
