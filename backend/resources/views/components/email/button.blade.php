{{--
    A large, easy-to-tap button. Full width on phones.
    <x-email.button :href="$booking_url">View my booking</x-email.button>
    variant: primary (filled) or secondary (outline).
    fallback: also print the link as text, for security emails where people may not trust buttons.
--}}
@props(['href', 'variant' => 'primary', 'fallback' => false, 'center' => false])
@php
    $c = \App\Mail\Templates\EmailTheme::COLORS;
    $primary = $variant === 'primary';
    $bg = $primary ? $c['sage'] : $c['surface'];
    $fg = $primary ? '#ffffff' : $c['sage_deep'];
    // The layout's Gmail/iOS link reset forces `color: inherit !important` on every <a>,
    // so the colour is also set on the cell (what the link inherits) and on an inner span.
@endphp
@if (filled($href))
<tr>
    <td class="em-px" align="{{ $center ? 'center' : 'left' }}" style="padding:10px 40px {{ $fallback ? '12px' : '24px' }};">
        <table role="presentation" class="em-btn-table" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
            <tr>
                <td align="center" bgcolor="{{ $bg }}" style="border-radius:12px; background-color:{{ $bg }}; color:{{ $fg }}; mso-padding-alt:16px 32px;{{ $primary ? '' : ' border:2px solid '.$c['sage'].';' }}">
                    <a href="{{ $href }}" target="_blank" class="em-btn"
                       style="display:inline-block; padding:{{ $primary ? '16px 32px' : '14px 30px' }}; border-radius:12px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:18px; line-height:1.25; font-weight:700; color:{{ $fg }}; text-decoration:none; mso-line-height-rule:exactly;"><span style="color:{{ $fg }};">{{ $slot }}</span></a>
                </td>
            </tr>
        </table>
    </td>
</tr>
@if ($fallback)
<tr>
    <td class="em-px" style="padding:0 40px 24px;">
        <p style="margin:0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:15px; line-height:1.55; color:{{ $c['muted'] }};">
            Button not working? Copy this link into your browser:<br>
            <a href="{{ $href }}" target="_blank" style="color:{{ $c['sage_deep'] }}; word-break:break-all; text-decoration:underline;">{{ $href }}</a>
        </p>
    </td>
</tr>
@endif
@endif
