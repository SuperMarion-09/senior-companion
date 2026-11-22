@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="👤" badge="Account update" tone="info">Your account details were updated</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, some details on your Kaagapay account were changed{{ $changed_at ? ' on '.$changed_at : '' }}. Please take a moment to check they are correct.</x-email.lead>

    @if (! empty($changes))
        <x-email.details title="What changed">
            @foreach ($changes as $change)
                <x-email.detail :label="$change['label']" :value="$change['value']" :previous="$change['previous'] ?? null" />
            @endforeach
        </x-email.details>
    @endif

    <x-email.button :href="$account_url">Review my account</x-email.button>

    <x-email.callout tone="danger" icon="⚠️" title="Did you not make this change?">
        Please call us right away at {{ $brand['support_phone'] }}. We will check your account with you and undo anything you did not ask for.
    </x-email.callout>
@endsection
