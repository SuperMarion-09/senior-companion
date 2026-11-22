{{-- A simple bulleted list: <x-email.bullets :items="$announcement_highlights" /> --}}
@props(['items' => []])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
@if (! empty($items))
<tr>
    <td class="em-px" style="padding:0 40px 16px;">
        <ul style="margin:0; padding:0 0 0 22px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:17px; line-height:1.6; color:{{ $c['text'] }};">
            @foreach ($items as $item)
                <li style="margin:0 0 8px;">{{ $item }}</li>
            @endforeach
        </ul>
    </td>
</tr>
@endif
