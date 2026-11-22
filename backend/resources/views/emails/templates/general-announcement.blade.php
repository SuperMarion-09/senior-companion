@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="📣" badge="News from Kaagapay" tone="clay">{{ $announcement_title }}</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }},</x-email.lead>

    @foreach (preg_split('/\R{2,}/', trim($announcement_body)) as $paragraph)
        <x-email.text>{!! nl2br(e($paragraph)) !!}</x-email.text>
    @endforeach

    @if (! empty($announcement_highlights))
        <x-email.checklist :items="$announcement_highlights" />
    @endif

    @if ($cta_url)
        <x-email.button :href="$cta_url">{{ $cta_label ?? 'Read more' }}</x-email.button>
    @endif

    <x-email.text muted small>Thank you for being part of the Kaagapay family. If you have any questions, just reply to this email.</x-email.text>
@endsection
