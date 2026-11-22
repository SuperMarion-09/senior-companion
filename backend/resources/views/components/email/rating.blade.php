{{--
    One-tap rating from 1 to 5. Each number links to $url with ?rating=N added,
    so the answer is saved even if they do not fill in the rest of the form.
--}}
@props(['url'])
@php
    $c = \App\Mail\Templates\EmailTheme::COLORS;
    $font = \App\Mail\Templates\EmailTheme::FONT_BODY;
    $join = str_contains($url, '?') ? '&' : '?';
    $labels = [1 => 'Poor', 2 => 'Fair', 3 => 'Good', 4 => 'Very good', 5 => 'Wonderful'];
@endphp
<tr>
    <td class="em-px" align="center" style="padding:6px 40px 8px;">
        <table role="presentation" class="em-rating" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
            <tr>
                @foreach ($labels as $n => $label)
                    <td align="center" style="padding:0 4px;">
                        <a href="{{ $url.$join.'rating='.$n }}" target="_blank" title="{{ $n }} out of 5: {{ $label }}"
                           style="display:block; width:56px; padding:10px 0 8px; border:2px solid {{ $c['sage'] }}; border-radius:12px; background-color:#ffffff; font-family:{!! $font !!}; text-align:center; text-decoration:none; color:{{ $c['sage_deep'] }};">
                            <span data-text="skip" aria-hidden="true" style="display:block; font-size:20px; line-height:1.1; color:#c98a1b;">&#9733;</span>
                            <span style="display:block; font-size:18px; line-height:1.3; font-weight:700;">{{ $n }}</span>
                        </a>
                    </td>
                @endforeach
            </tr>
        </table>
    </td>
</tr>
<tr>
    <td class="em-px" align="center" style="padding:0 40px 22px; font-family:{!! $font !!}; font-size:15px; line-height:1.5; color:{{ $c['muted'] }};">
        1 = {{ $labels[1] }} &nbsp;&middot;&nbsp; 5 = {{ $labels[5] }}
    </td>
</tr>
