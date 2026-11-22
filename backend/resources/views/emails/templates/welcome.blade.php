@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🌿" badge="Welcome to the family" tone="clay">Welcome to Kaagapay, {{ $customer_name }}</x-email.hero>

    <x-email.lead>We are so glad you are here. Kaagapay matches seniors with kind, trained companions for errands, walks, appointments and good conversation, so your loved one never has to go alone.</x-email.lead>

    <x-email.heading>How it works</x-email.heading>
    <x-email.steps :steps="[
        ['title' => 'Choose a service', 'text' => 'Errands, shopping, walks, appointments or a friendly visit.'],
        ['title' => 'Send your request', 'text' => 'Pick a date and time. It takes about five minutes.'],
        ['title' => 'We confirm and match a companion', 'text' => 'Our team calls or emails you within one business day.'],
        ['title' => 'Enjoy the time together', 'text' => 'Your companion arrives on time, ready to help.'],
    ]" />

    <x-email.button :href="$booking_url ?? $brand['booking_url']">Book a companion</x-email.button>

    <x-email.callout icon="💬" title="Prefer to talk to someone?">
        Many families like to call us first. We are happy to answer questions and help you book over the phone at {{ $brand['support_phone'] }}.
    </x-email.callout>
@endsection
