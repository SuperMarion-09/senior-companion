{{-- Dark footer: logo, tagline, how to reach us, legal links and the emergency note. --}}
@props(['brand'])
@php
    $c = \App\Mail\Templates\EmailTheme::COLORS;
    $font = \App\Mail\Templates\EmailTheme::FONT_BODY;
    $link = "color:{$c['night_link']}; font-weight:700; text-decoration:underline;";
@endphp
<tr>
    <td class="em-px" bgcolor="{{ $c['night'] }}" style="background-color:{{ $c['night'] }}; border-radius:0 0 19px 19px; padding:30px 40px 32px; font-family:{!! $font !!}; font-size:16px; line-height:1.6; color:{{ $c['night_muted'] }};">
        <img src="{{ $brand['logo_footer_url'] }}" width="132" height="30" alt="{{ $brand['name'] }}"
             style="display:block; width:132px; height:auto; border:0; margin:0 0 10px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:20px; font-weight:700; color:{{ $c['night_text'] }};">
        <p style="margin:0 0 18px; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:17px; color:{{ $c['gold'] }};">{{ $brand['tagline'] }}</p>

        <p style="margin:0 0 4px; font-weight:700; color:{{ $c['night_text'] }};">We are here to help</p>
        <p style="margin:0 0 18px;">
            Call <a href="{{ $brand['support_phone_href'] }}" style="{{ $link }}">{{ $brand['support_phone'] }}</a>
            or email <a href="mailto:{{ $brand['support_email'] }}" style="{{ $link }}">{{ $brand['support_email'] }}</a><br>
            {{ $brand['support_hours'] }}
        </p>

        <p style="margin:0 0 18px; font-size:15px;">
            <a href="{{ $brand['website_url'] }}" target="_blank" style="{{ $link }}">{{ $brand['website_label'] }}</a>
            <span data-text="skip" style="color:{{ $c['night_muted'] }};">&nbsp;&middot;&nbsp;</span>
            <a href="{{ $brand['privacy_url'] }}" target="_blank" style="{{ $link }}">Privacy Policy</a>
            <span data-text="skip" style="color:{{ $c['night_muted'] }};">&nbsp;&middot;&nbsp;</span>
            <a href="{{ $brand['terms_url'] }}" target="_blank" style="{{ $link }}">Terms of Service</a>
        </p>

        <p style="margin:0; font-size:14px; line-height:1.55;">
            <strong style="color:{{ $c['night_text'] }};">In an emergency, always call 911 first.</strong>
            {{ $brand['name'] }} provides non-medical companionship services only.
        </p>
    </td>
</tr>
