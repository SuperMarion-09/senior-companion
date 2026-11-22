@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🤝" badge="Companion assigned" tone="success">Meet {{ $companion_name }}</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, we have matched {{ $senior_name ? $senior_name.' with' : 'you with' }} a companion. We think they will get along wonderfully. Here is a little about {{ \Illuminate\Support\Str::of($companion_name)->before(' ') }}, so you know who to expect.</x-email.lead>

    <x-email.companion :name="$companion_name" :photo="$companion_photo_url" :bio="$companion_bio" :href="$companion_profile_url"
        :facts="['With Kaagapay' => $companion_experience, 'Speaks' => $companion_languages, 'Enjoys' => $companion_interests]" />

    @include('emails.partials.booking-details', ['title' => 'Their visit', 'showCompanion' => false])

    <x-email.button :href="$booking_url">View my booking</x-email.button>

    <x-email.callout tone="info" icon="🪪" title="For your peace of mind">
        Every Kaagapay companion has been interviewed, background-checked and trained. They will wear a Kaagapay ID and introduce themselves when they arrive.
    </x-email.callout>
@endsection
