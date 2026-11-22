{{-- The greeting and first paragraph right under the headline, with a little more space above. --}}
@props([])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
<tr>
    <td class="em-px" style="padding:18px 40px 16px;">
        <p style="margin:0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:18px; line-height:1.6; color:{{ $c['text'] }};">{{ $slot }}</p>
    </td>
</tr>
