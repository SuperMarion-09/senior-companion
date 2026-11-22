{{--
    One row inside <x-email.details>. Hidden when value is empty.
    previous: the old value, shown crossed out above the new one (rescheduling).
    total: bold row with a thicker line, for amounts.
--}}
@props(['label', 'value' => null, 'previous' => null, 'mono' => false, 'total' => false])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
@if (filled($value))
<tr>
    <td class="em-stack em-stack-label" width="40%" valign="top" style="width:40%; padding:11px 12px 11px 0; border-top:{{ $total ? '2px solid '.$c['text'] : '1px solid '.$c['border'] }}; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:16px; line-height:1.5; color:{{ $c['muted'] }};{{ $total ? ' font-weight:700; color:'.$c['text'].';' : '' }}">{{ $label }}</td>
    <td class="em-stack em-stack-value" valign="top" style="padding:11px 0; border-top:{{ $total ? '2px solid '.$c['text'] : '1px solid '.$c['border'] }}; font-family:{!! $mono ? \App\Mail\Templates\EmailTheme::FONT_MONO : \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:{{ $total ? '19px' : '17px' }}; line-height:1.5; font-weight:700; color:{{ $c['text'] }};">
        @if (filled($previous))
            <span style="display:block; font-weight:400; font-size:15px; color:{{ $c['muted'] }};">Was: <span style="text-decoration:line-through;">{{ $previous }}</span></span>
            <span style="display:block; font-weight:400; font-size:15px; color:{{ $c['muted'] }};">Now:</span>
        @endif
        {!! nl2br(e($value)) !!}
    </td>
</tr>
@endif
