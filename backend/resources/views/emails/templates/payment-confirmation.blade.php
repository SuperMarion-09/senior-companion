@extends('emails.layouts.base')

@section('content')
    <x-email.hero icon="🧾" badge="Payment received" tone="success">Thank you, your payment is complete</x-email.hero>

    <x-email.lead>Hello {{ $customer_name }}, we have received your payment of <strong>{{ $total_amount }}</strong>. This email is your receipt.</x-email.lead>

    <x-email.details :reference="$payment_reference" reference-label="Receipt number" title="Payment summary">
        @foreach ($line_items ?? [] as $item)
            <x-email.detail :label="$item['label']" :value="$item['amount']" />
        @endforeach
        <x-email.detail label="Total paid" :value="$total_amount" total />
    </x-email.details>

    <x-email.details title="Payment details">
        <x-email.detail label="Paid on" :value="$paid_at" />
        <x-email.detail label="Paid with" :value="$payment_method" />
        <x-email.detail label="For booking" :value="$booking_reference" mono />
        <x-email.detail label="Service" :value="$service_name" />
        <x-email.detail label="Visit date" :value="$booking_date ? trim($booking_date.($booking_time ? ', '.$booking_time : '')) : null" />
    </x-email.details>

    <x-email.button :href="$receipt_url ?? $booking_url">{{ $receipt_url ? 'View or print my receipt' : 'View my booking' }}</x-email.button>

    <x-email.text muted small>Transportation, parking and other expenses during the visit are paid separately, on the day.</x-email.text>
@endsection
