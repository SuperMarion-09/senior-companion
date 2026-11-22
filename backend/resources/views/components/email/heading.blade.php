{{-- A section title inside the email: <x-email.heading>What happens next</x-email.heading> --}}
@props([])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
<tr>
    <td class="em-px" style="padding:16px 40px 10px;">
        <h2 style="margin:0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:21px; line-height:1.3; font-weight:700; color:{{ $c['text'] }};">{{ $slot }}</h2>
    </td>
</tr>
