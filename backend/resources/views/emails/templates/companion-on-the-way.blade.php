@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🚗" badge="On the way" tone="success">{{ $companion_name }} is on the way</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, {{ $companion_name }} has left and expects to arrive <strong>{{ $eta }}</strong>{{ $arrival_time ? ', at about '.$arrival_time : '' }}.</x-email.lead>

    <x-email.companion :name="$companion_name" :photo="$companion_photo_url" role="Arriving {{ $eta }}"
        :facts="['Meeting place' => $booking_location, 'Phone' => $companion_phone]" />

    @if ($tracking_url)
        <x-email.button :href="$tracking_url">See where {{ \Illuminate\Support\Str::of($companion_name)->before(' ') }} is</x-email.button>
    @elseif ($companion_phone)
        <x-email.button :href="'tel:'.preg_replace('/[^0-9+]/', '', $companion_phone)">Call {{ \Illuminate\Support\Str::of($companion_name)->before(' ') }}</x-email.button>
    @endif

    <x-email.heading>While you wait</x-email.heading>
    <x-email.checklist :items="[
        'Have an ID, cards and money for the day ready by the door.',
        'Your companion will show a Kaagapay ID. Please check it before going out.',
        'Running late? A quick call or text helps them plan.',
    ]" />

    @if ($booking_reference)
        <x-email.text muted small>Booking {{ $booking_reference }}{{ $service_name ? ' · '.$service_name : '' }}{{ $booking_time ? ' · starts '.$booking_time : '' }}</x-email.text>
    @endif
@endsection
