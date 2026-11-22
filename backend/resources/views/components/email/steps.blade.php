{{--
    Numbered steps, e.g. "What happens next".
    <x-email.steps :steps="[['title' => 'We review', 'text' => '…'], …]" />
--}}
@props(['steps' => []])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
<tr>
    <td class="em-px" style="padding:4px 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            @foreach ($steps as $i => $step)
                <tr>
                    <td width="48" valign="top" style="width:48px; padding:0 0 18px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td width="34" height="34" align="center" valign="middle" bgcolor="{{ $c['sage'] }}" style="width:34px; height:34px; border-radius:17px; background-color:{{ $c['sage'] }}; color:#ffffff; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:16px; font-weight:700; line-height:34px; text-align:center;">{{ $i + 1 }}</td>
                            </tr>
                        </table>
                    </td>
                    <td valign="top" style="padding:4px 0 18px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:17px; line-height:1.55; color:{{ $c['text'] }};">
                        <p style="margin:0; font-weight:700;">{{ $step['title'] }}</p>
                        @if (! empty($step['text']))
                            <p style="margin:2px 0 0; color:{{ $c['muted'] }};">{{ $step['text'] }}</p>
                        @endif
                    </td>
                </tr>
            @endforeach
        </table>
    </td>
</tr>
