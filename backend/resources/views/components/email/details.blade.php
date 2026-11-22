{{--
    A soft panel of label/value rows (booking details, payment summary).
    <x-email.details title="Visit details">
        <x-email.detail label="Date" :value="$booking_date" />
    </x-email.details>
    Rows with an empty value are left out automatically.
--}}
@props(['title' => null, 'reference' => null, 'referenceLabel' => 'Booking reference'])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
<tr>
    <td class="em-px" style="padding:8px 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{{ $c['cream'] }}" style="background-color:{{ $c['cream'] }}; border:1px solid {{ $c['border'] }}; border-radius:14px; border-collapse:separate;">
            @if ($reference)
                <tr>
                    <td style="padding:20px 22px 4px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!};">
                        <p style="margin:0; font-size:14px; line-height:1.4; letter-spacing:0.06em; text-transform:uppercase; font-weight:700; color:{{ $c['muted'] }};">{{ $referenceLabel }}</p>
                        <p style="margin:4px 0 0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_MONO !!}; font-size:26px; line-height:1.2; letter-spacing:0.06em; font-weight:700; color:{{ $c['sage_deep'] }};">{{ $reference }}</p>
                    </td>
                </tr>
            @endif
            @if ($title)
                <tr>
                    <td style="padding:{{ $reference ? '14px' : '20px' }} 22px 4px;">
                        <p style="margin:0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:19px; line-height:1.3; font-weight:700; color:{{ $c['text'] }};">{{ $title }}</p>
                    </td>
                </tr>
            @endif
            <tr>
                <td style="padding:8px 22px 14px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        {{ $slot }}
                    </table>
                </td>
            </tr>
        </table>
    </td>
</tr>
