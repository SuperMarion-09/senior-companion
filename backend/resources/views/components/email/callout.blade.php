{{--
    A coloured message box for something important.
    <x-email.callout tone="warning" title="Was this not you?">Call us right away.</x-email.callout>
    tone: info, success, warning, danger, clay, neutral.
--}}
@props(['tone' => 'info', 'title' => null, 'icon' => null])
@php($t = \App\Mail\Templates\EmailTheme::tone($tone))
<tr>
    <td class="em-px" style="padding:4px 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{{ $t['bg'] }}" style="background-color:{{ $t['bg'] }}; border:1px solid {{ $t['border'] }}; border-radius:14px; border-collapse:separate;">
            <tr>
                @if ($icon)
                    <td width="44" valign="top" data-text="skip" aria-hidden="true" style="width:44px; padding:18px 0 18px 20px; font-size:22px; line-height:1.3;">{{ $icon }}</td>
                @endif
                <td valign="top" style="padding:18px 20px 18px {{ $icon ? '10px' : '20px' }}; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:17px; line-height:1.6; color:{{ $t['fg'] }};">
                    @if ($title)
                        <p style="margin:0 0 4px; font-weight:700;">{{ $title }}</p>
                    @endif
                    <p style="margin:0;">{{ $slot }}</p>
                </td>
            </tr>
        </table>
    </td>
</tr>
