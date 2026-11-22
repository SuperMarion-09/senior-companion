{{--
    The top of every email: a friendly icon, an optional status pill and the headline.
    <x-email.hero icon="🌿" badge="Booking confirmed" tone="success">Your companion is ready</x-email.hero>
    Use :status="$booking_status" instead of badge to show the booking status.
--}}
@props(['icon' => null, 'badge' => null, 'tone' => 'info', 'status' => null])
@php
    $c = \App\Mail\Templates\EmailTheme::COLORS;
@endphp
<tr>
    <td class="em-px" style="padding:36px 40px 6px;">
        @if ($icon)
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;" data-text="skip">
                <tr>
                    <td width="60" height="60" align="center" valign="middle" bgcolor="{{ $c['sage_soft'] }}" aria-hidden="true"
                        style="width:60px; height:60px; border-radius:30px; background-color:{{ $c['sage_soft'] }}; font-size:28px; line-height:60px; text-align:center;">{{ $icon }}</td>
                </tr>
            </table>
        @endif
        @if ($status)
            <p style="margin:0 0 14px;"><x-email.status :status="$status" /></p>
        @elseif ($badge)
            <p style="margin:0 0 14px;"><x-email.pill :tone="$tone">{{ $badge }}</x-email.pill></p>
        @endif
        <h1 class="em-h1" style="margin:0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:30px; line-height:1.25; font-weight:700; color:{{ $c['text'] }};">{{ $slot }}</h1>
    </td>
</tr>
