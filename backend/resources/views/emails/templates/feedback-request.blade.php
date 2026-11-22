@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="⭐">How was {{ $senior_name ? $senior_name."'s" : 'the' }} visit?</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, we hope the visit{{ $companion_name ? ' with '.$companion_name : '' }}{{ $booking_date ? ' on '.$booking_date : '' }} went well. Would you tell us how it was? Just tap a number.</x-email.lead>

    <x-email.rating :url="$feedback_url" />

    <x-email.text center muted small>Your answer is saved with one tap. You can add a comment on the next page if you like.</x-email.text>

    <x-email.button :href="$feedback_url" variant="secondary" center>Write a few words instead</x-email.button>

    <x-email.callout tone="neutral" icon="💛" title="Something not right?">
        If anything about the visit worried you, please call us at {{ $brand['support_phone'] }}. We take every concern seriously.
    </x-email.callout>
@endsection
