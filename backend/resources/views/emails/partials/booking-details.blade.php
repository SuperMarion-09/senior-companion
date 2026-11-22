{{--
    The booking summary most booking emails share. Uses the template's own
    variables; rows without a value are hidden.
    @include('emails.partials.booking-details', ['title' => 'Your visit'])
--}}
<x-email.details :reference="$booking_reference ?? null" :title="$title ?? null">
    <x-email.detail label="Companion for" :value="$senior_name ?? null" />
    <x-email.detail label="Service" :value="$service_name ?? null" />
    <x-email.detail label="Date" :value="$booking_date ?? null" :previous="$previous_booking_date ?? null" />
    <x-email.detail label="Start time" :value="$booking_time ?? null" :previous="$previous_booking_time ?? null" />
    <x-email.detail label="Duration" :value="$booking_duration ?? null" />
    <x-email.detail label="Meeting place" :value="$booking_location ?? null" />
    <x-email.detail label="Going to" :value="$booking_destination ?? null" />
    <x-email.detail label="Your companion" :value="($showCompanion ?? true) ? ($companion_name ?? null) : null" />
    <x-email.detail label="Total" :value="$total_amount ?? null" />
</x-email.details>
