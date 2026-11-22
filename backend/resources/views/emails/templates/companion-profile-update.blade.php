@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="📋" badge="Companion update" tone="info">An update about {{ $companion_name }}</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, we wanted to let you know about a change to {{ $companion_name }}'s details for {{ $senior_name ? $senior_name."'s" : 'your' }} upcoming visit.</x-email.lead>

    @if ($update_note)
        <x-email.text>{{ $update_note }}</x-email.text>
    @endif

    @if (! empty($changes))
        <x-email.details title="What changed">
            @foreach ($changes as $change)
                <x-email.detail :label="$change['label']" :value="$change['value']" :previous="$change['previous'] ?? null" />
            @endforeach
        </x-email.details>
    @endif

    @include('emails.partials.booking-details', ['title' => 'The visit', 'showCompanion' => false])

    <x-email.button :href="$companion_profile_url ?? $booking_url">{{ $companion_profile_url ? 'See '.\Illuminate\Support\Str::of($companion_name)->before(' ')."'s profile" : 'View my booking' }}</x-email.button>

    @include('emails.partials.need-help')
@endsection
