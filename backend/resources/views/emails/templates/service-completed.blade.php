@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🌻" :status="'completed'">Thank you for spending time with us</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, {{ $senior_name ? $senior_name."'s" : 'your' }} visit{{ $companion_name ? ' with '.$companion_name : '' }} is complete. It was a privilege to be part of the day.</x-email.lead>

    @if ($visit_summary)
        <x-email.quote :author="$companion_name ?: 'The Kaagapay team'">{{ $visit_summary }}</x-email.quote>
    @endif

    <x-email.details title="Visit summary">
        <x-email.detail label="Reference" :value="$booking_reference" mono />
        <x-email.detail label="Service" :value="$service_name" />
        <x-email.detail label="Date" :value="$booking_date" />
        <x-email.detail label="Time" :value="$booking_time" />
        <x-email.detail label="Duration" :value="$booking_duration" />
        <x-email.detail label="Companion" :value="$companion_name" />
    </x-email.details>

    @if ($feedback_url)
        <x-email.heading>How did it go?</x-email.heading>
        <x-email.text>Your feedback helps {{ $companion_name ?: 'our companions' }} and our whole team care better. It takes less than a minute.</x-email.text>
        <x-email.rating :url="$feedback_url" />
    @endif

    <x-email.link :href="$rebook_url ?? $brand['booking_url']">Book another visit</x-email.link>
@endsection
