{{-- The booking status as families should read it: <x-email.status status="pending" /> --}}
@props(['status'])
@php($s = \App\Mail\Templates\EmailTheme::status($status))
<span style="display:inline-block; padding:6px 14px; border-radius:999px; background-color:{{ $s['tone']['bg'] }}; border:1px solid {{ $s['tone']['border'] }}; color:{{ $s['tone']['fg'] }}; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:15px; line-height:1.3; font-weight:700;"><span data-text="skip" aria-hidden="true">&#9679;&nbsp;</span>{{ $s['label'] }}</span>
