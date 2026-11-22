{{--
    A paragraph. <x-email.text>Hello {{ $customer_name }},</x-email.text>
    muted: grey secondary text. small: 16px instead of 18px. center: centred.
--}}
@props(['muted' => false, 'small' => false, 'center' => false, 'last' => false])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
<tr>
    <td class="em-px" style="padding:{{ $last ? '0 40px 8px' : '0 40px 16px' }};{{ $center ? ' text-align:center;' : '' }}">
        <p style="margin:0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:{{ $small ? '16px' : '18px' }}; line-height:1.6; color:{{ $muted ? $c['muted'] : $c['text'] }};">{{ $slot }}</p>
    </td>
</tr>
