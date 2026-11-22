{{-- Sage band with the white logo and a thin clay line, as in the brand guidelines. --}}
@props(['brand'])
@php($c = \App\Mail\Templates\EmailTheme::COLORS)
<tr>
    <td class="em-px" bgcolor="{{ $c['sage'] }}" style="background-color:{{ $c['sage'] }}; border-radius:19px 19px 0 0; padding:26px 40px 24px;">
        <a href="{{ $brand['website_url'] }}" target="_blank" style="text-decoration:none; color:#ffffff;">
            <img src="{{ $brand['logo_url'] }}" width="168" height="38" alt="{{ $brand['name'] }}"
                 style="display:block; width:168px; height:auto; max-width:100%; border:0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:26px; font-weight:700; line-height:38px; color:#ffffff;">
        </a>
    </td>
</tr>
<tr>
    <td data-text="skip" bgcolor="{{ $c['clay'] }}" style="height:5px; line-height:5px; font-size:0; background-color:{{ $c['clay'] }};">&nbsp;</td>
</tr>
