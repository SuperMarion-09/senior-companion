@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="📅" :status="$booking_status ?? 'confirmed'">
        @if (in_array($booking_status, ['pending', 'cancelled', 'rejected'], true))
            Your booking details
        @elseif ($senior_name)
            Everything is ready for {{ $senior_name }}'s visit
        @else
            Your booking is confirmed
        @endif
    </x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, thank you for trusting Kaagapay. Here is everything you need for the visit on <strong>{{ $booking_date }}</strong>. Please keep this email for your records.</x-email.lead>

    @include('emails.partials.booking-details', ['title' => 'Your visit'])

    @if ($booking_status === 'pending')
        <x-email.callout tone="warning" icon="⏳" title="Almost there">
            We are still confirming a companion for this time. We will contact you within one business day.
        </x-email.callout>
    @elseif (! $companion_name)
        <x-email.callout tone="info" icon="🤝" title="Your companion">
            We are choosing the best companion for {{ $senior_name ?: 'your loved one' }}. You will receive their name and a short introduction before the visit.
        </x-email.callout>
    @endif

    @if ($special_instructions)
        <x-email.callout tone="neutral" icon="📝" title="Your notes for the companion">{{ $special_instructions }}</x-email.callout>
    @endif

    <x-email.button :href="$booking_url">View my booking</x-email.button>

    <x-email.heading>Before the visit</x-email.heading>
    <x-email.checklist :items="[
        'Have a valid ID and any cards needed for the errands or appointment.',
        'Write down medicines and allergies, in case a doctor asks.',
        'Keep your phone nearby. We will message you if anything changes.',
    ]" />

    <x-email.callout tone="info" icon="💡" title="Good to know">
        Kaagapay provides non-medical companionship only. Transportation, parking and other expenses are paid separately. Extending the visit on the day needs our approval.
    </x-email.callout>

    @include('emails.partials.need-help')
@endsection
