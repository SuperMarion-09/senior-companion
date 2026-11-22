{{-- A quieter, secondary action as a text link: <x-email.link :href="$url">Book another date</x-email.link> --}}
@props(['href'])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
@if (filled($href))
<tr>
    <td class="em-px" style="padding:0 40px 20px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:17px; line-height:1.5;">
        <a href="{{ $href }}" target="_blank" style="color:{{ $c['sage_deep'] }}; font-weight:700; text-decoration:underline;">{{ $slot }}</a>
    </td>
</tr>
@endif
