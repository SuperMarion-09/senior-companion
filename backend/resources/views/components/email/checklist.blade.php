{{-- A list with check marks: <x-email.checklist :items="['Bring an ID', '…']" /> --}}
@props(['items' => []])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
@if (! empty($items))
<tr>
    <td class="em-px" style="padding:0 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            @foreach ($items as $item)
                <tr>
                    <td width="34" valign="top" style="width:34px; padding:2px 0 12px;" data-text="skip">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td width="24" height="24" align="center" valign="middle" bgcolor="{{ $c['sage_soft'] }}" aria-hidden="true" style="width:24px; height:24px; border-radius:12px; background-color:{{ $c['sage_soft'] }}; color:{{ $c['sage_deep'] }}; font-size:14px; font-weight:700; line-height:24px; text-align:center;">&#10003;</td>
                            </tr>
                        </table>
                    </td>
                    <td valign="top" style="padding:0 0 12px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:17px; line-height:1.55; color:{{ $c['text'] }};">{{ $item }}</td>
                </tr>
            @endforeach
        </table>
    </td>
</tr>
@endif
