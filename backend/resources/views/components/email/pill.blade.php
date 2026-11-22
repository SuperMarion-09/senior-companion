{{-- A small rounded label, e.g. <x-email.pill tone="success">Booking confirmed</x-email.pill> --}}
@props(['tone' => 'info'])
@php($t = \App\Mail\Templates\EmailTheme::tone($tone))
<span style="display:inline-block; padding:6px 14px; border-radius:999px; background-color:{{ $t['bg'] }}; border:1px solid {{ $t['border'] }}; color:{{ $t['fg'] }}; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:15px; line-height:1.3; font-weight:700;"><span data-text="skip" aria-hidden="true">&#9679;&nbsp;</span>{{ $slot }}</span>
