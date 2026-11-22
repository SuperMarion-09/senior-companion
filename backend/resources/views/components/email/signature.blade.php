{{-- Warm sign-off above the footer. Hide it in a template with @section('hide_signature', true). --}}
@props(['brand', 'name' => null])
@php
    $c = \App\Mail\Templates\EmailTheme::COLORS;
    $font = \App\Mail\Templates\EmailTheme::FONT_BODY;
@endphp
<tr>
    <td class="em-px" style="padding:8px 40px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid {{ $c['border'] }};">
            <tr>
                <td width="60" valign="top" style="width:60px; padding-top:22px;" data-text="skip">
                    <img src="{{ $brand['mark_url'] }}" width="44" height="44" alt="" style="display:block; width:44px; height:44px; border:0;">
                </td>
                <td valign="top" style="padding-top:20px; font-family:{!! $font !!}; font-size:17px; line-height:1.5; color:{{ $c['text'] }};">
                    <p style="margin:0;">Salamat po,</p>
                    <p style="margin:2px 0 0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:19px; font-weight:700;">{{ $name ?? $brand['signature_name'] }}</p>
                    <p style="margin:0; font-size:16px; color:{{ $c['muted'] }};">{{ $brand['name'] }}</p>
                </td>
            </tr>
        </table>
    </td>
</tr>
