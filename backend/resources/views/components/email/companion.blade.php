{{--
    Introduces a companion: photo (or their initials), name, a few facts and a short bio.
    <x-email.companion :name="$companion_name" :photo="$companion_photo_url" :bio="$companion_bio"
        :facts="['Experience' => $companion_experience, 'Languages' => $companion_languages]" />
--}}
@props(['name', 'photo' => null, 'role' => 'Your Kaagapay companion', 'bio' => null, 'facts' => [], 'href' => null])
@php
    $c = \App\Mail\Templates\EmailTheme::COLORS;
    $font = \App\Mail\Templates\EmailTheme::FONT_BODY;
    $initials = collect(preg_split('/\s+/', trim((string) $name)))->filter()->take(2)
        ->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)))->implode('');
    $facts = array_filter($facts, fn ($value) => filled($value));
@endphp
<tr>
    <td class="em-px" style="padding:8px 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{{ $c['cream'] }}" style="background-color:{{ $c['cream'] }}; border:1px solid {{ $c['border'] }}; border-radius:14px; border-collapse:separate;">
            <tr>
                <td style="padding:22px 22px 6px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td width="84" valign="middle" style="width:84px;">
                                @if ($photo)
                                    <img src="{{ $photo }}" width="68" height="68" alt="Photo of {{ $name }}" style="display:block; width:68px; height:68px; border-radius:34px; border:3px solid #ffffff; object-fit:cover;">
                                @else
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" data-text="skip">
                                        <tr>
                                            <td width="68" height="68" align="center" valign="middle" bgcolor="{{ $c['clay_soft'] }}" aria-hidden="true" style="width:68px; height:68px; border-radius:34px; background-color:{{ $c['clay_soft'] }}; color:{{ $c['clay'] }}; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:24px; font-weight:700; line-height:68px; text-align:center;">{{ $initials }}</td>
                                        </tr>
                                    </table>
                                @endif
                            </td>
                            <td valign="middle" style="font-family:{!! $font !!};">
                                <p style="margin:0; font-family:{!! \App\Mail\Templates\EmailTheme::FONT_HEADING !!}; font-size:22px; line-height:1.25; font-weight:700; color:{{ $c['text'] }};">{{ $name }}</p>
                                <p style="margin:2px 0 0; font-size:16px; line-height:1.4; color:{{ $c['muted'] }};">{{ $role }}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            @if ($bio)
                <tr>
                    <td style="padding:12px 22px 4px; font-family:{!! $font !!}; font-size:17px; line-height:1.6; color:{{ $c['text'] }};">
                        <p style="margin:0;">{{ $bio }}</p>
                    </td>
                </tr>
            @endif
            @if ($facts)
                <tr>
                    <td style="padding:8px 22px 8px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            @foreach ($facts as $label => $value)
                                <x-email.detail :label="$label" :value="$value" />
                            @endforeach
                        </table>
                    </td>
                </tr>
            @endif
            @if ($href)
                <tr>
                    <td style="padding:6px 22px 20px; font-family:{!! $font !!}; font-size:17px;">
                        <a href="{{ $href }}" target="_blank" style="color:{{ $c['sage_deep'] }}; font-weight:700; text-decoration:underline;">See {{ \Illuminate\Support\Str::of($name)->before(' ') }}'s full profile</a>
                    </td>
                </tr>
            @else
                <tr><td style="height:14px; line-height:14px; font-size:0;">&nbsp;</td></tr>
            @endif
        </table>
    </td>
</tr>
