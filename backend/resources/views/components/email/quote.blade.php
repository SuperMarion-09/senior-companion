{{-- A personal note, e.g. from the companion after a visit. --}}
@props(['author' => null])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
<tr>
    <td class="em-px" style="padding:4px 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td bgcolor="{{ $c['clay_soft'] }}" style="background-color:{{ $c['clay_soft'] }}; border-left:4px solid {{ $c['clay'] }}; border-radius:0 12px 12px 0; padding:18px 22px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:18px; line-height:1.6; color:{{ $c['text'] }};">
                    <p style="margin:0;">&ldquo;{{ $slot }}&rdquo;</p>
                    @if ($author)
                        <p style="margin:8px 0 0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_BODY !!}; font-size:16px; font-weight:700; color:{{ $c['clay'] }};">&mdash; {{ $author }}</p>
                    @endif
                </td>
            </tr>
        </table>
    </td>
</tr>
