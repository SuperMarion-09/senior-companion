{{-- A code to type in, e.g. a verification or promo code. --}}
@props(['code', 'label' => 'Your code'])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
@if (filled($code))
<tr>
    <td class="em-px" style="padding:4px 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px dashed {{ $c['sage'] }}; border-radius:14px; border-collapse:separate;">
            <tr>
                <td align="center" style="padding:16px 12px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!};">
                    <p style="margin:0; font-size:14px; line-height:1.4; letter-spacing:0.06em; text-transform:uppercase; font-weight:700; color:{{ $c['muted'] }};">{{ $label }}</p>
                    <p style="margin:4px 0 0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_MONO !!}; font-size:30px; line-height:1.2; letter-spacing:0.18em; font-weight:700; color:{{ $c['sage_deep'] }};">{{ $code }}</p>
                </td>
            </tr>
        </table>
    </td>
</tr>
@endif
