{{-- A thin line between sections. --}}
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
<tr>
    <td class="em-px" style="padding:8px 40px 20px;" data-text="skip">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="border-top:1px solid {{ $c['border'] }}; height:1px; line-height:1px; font-size:0;">&nbsp;</td></tr>
        </table>
    </td>
</tr>
