@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🎁" badge="A little something for you" tone="clay">{{ $offer_title }}</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }},</x-email.lead>

    @foreach (preg_split('/\R{2,}/', trim($offer_description)) as $paragraph)
        <x-email.text>{!! nl2br(e($paragraph)) !!}</x-email.text>
    @endforeach

    <x-email.code :code="$offer_code" label="Use this code when you book" />

    @if ($cta_url)
        <x-email.button :href="$cta_url">{{ $cta_label ?? 'Book a visit' }}</x-email.button>
    @endif

    @if ($offer_expires || $offer_terms)
        <x-email.text muted small>
            {{ $offer_expires ? 'Offer ends '.$offer_expires.'.' : '' }}
            {{ $offer_terms }}
        </x-email.text>
    @endif
@endsection
