{{--
    The frame around every Kaagapay email: header, white card, signature,
    footer. Templates only provide @section('content') (see docs/EMAIL_TEMPLATES.md).

    Built for email apps, not browsers: tables for layout, every style inline
    (Gmail and Outlook remove most <style> rules), a fixed 600px column for
    Outlook on Windows, and the <style> below only for phones that support it.
--}}
@php
    $c = \App\Mail\Templates\EmailTheme::COLORS;
    $font = \App\Mail\Templates\EmailTheme::FONT_BODY;
@endphp
<!doctype html>
<html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{ $meta['subject'] }}</title>
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
    <style>table, td, p, a, span, h1, h2 { font-family: Arial, Helvetica, sans-serif !important; }</style>
    <![endif]-->
    <style>
        :root { color-scheme: light; supported-color-schemes: light; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        a { color: {{ $c['sage'] }}; }
        a[x-apple-data-detectors], #MessageViewBody a, u + .em-body a { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
        @media only screen and (max-width: 620px) {
            .em-outer { padding: 12px 8px 24px !important; }
            .em-px { padding-left: 22px !important; padding-right: 22px !important; }
            .em-h1 { font-size: 26px !important; line-height: 1.25 !important; }
            .em-stack { display: block !important; width: 100% !important; box-sizing: border-box; }
            .em-stack-label { padding-bottom: 0 !important; }
            .em-stack-value { border-top: 0 !important; padding-top: 2px !important; }
            .em-btn-table { width: 100% !important; }
            .em-btn { display: block !important; text-align: center !important; }
            .em-hide-mobile { display: none !important; }
            .em-rating a { width: 48px !important; }
        }
    </style>
</head>
<body class="em-body" style="margin:0; padding:0; width:100%; background-color:{{ $c['page'] }};">
    <div role="article" aria-roledescription="email" aria-label="{{ $meta['subject'] }}" lang="en" style="background-color:{{ $c['page'] }}; font-family:{!! $font !!}; color:{{ $c['text'] }};">

        {{-- Inbox preview text: shown next to the subject, hidden in the email itself. --}}
        <div data-text="skip" style="display:none; max-height:0; max-width:0; overflow:hidden; opacity:0; mso-hide:all; font-size:1px; line-height:1px; color:{{ $c['page'] }};">
            {{ $meta['preheader'] }}
            {!! str_repeat('&#847;&zwnj;&nbsp;', 60) !!}
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:{{ $c['page'] }};">
            <tr>
                <td align="center" class="em-outer" style="padding:32px 16px 40px;">
                    <!--[if mso]><table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; margin:0 auto;">
                        <tr>
                            <td>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:{{ $c['surface'] }}; border:1px solid {{ $c['border'] }}; border-radius:20px; border-collapse:separate;">
                                    <x-email.header :brand="$brand" />

                                    @yield('content')

                                    @sectionMissing('hide_signature')
                                        <x-email.signature :brand="$brand" />
                                    @endif

                                    <x-email.footer :brand="$brand" />
                                </table>
                            </td>
                        </tr>

                        {{-- Why they got it, unsubscribe (marketing only), copyright. --}}
                        <tr>
                            <td class="em-px" style="padding:22px 24px 0; font-family:{!! $font !!}; font-size:14px; line-height:1.6; color:{{ $c['muted'] }}; text-align:center;">
                                <p style="margin:0 0 8px;">{{ $meta['footer_reason'] }}</p>
                                @if ($meta['marketing'] && $meta['unsubscribe_url'])
                                    <p style="margin:0 0 8px;">
                                        Prefer not to receive news and offers?
                                        <a href="{{ $meta['unsubscribe_url'] }}" target="_blank" style="color:{{ $c['sage_deep'] }}; font-weight:700; text-decoration:underline;">Unsubscribe</a>.
                                        Booking emails will still reach you.
                                    </p>
                                @endif
                                <p style="margin:0;">&copy; {{ $brand['year'] }} {{ $brand['name'] }}. All rights reserved. &middot; {{ $brand['address'] }}</p>
                            </td>
                        </tr>
                    </table>
                    <!--[if mso]></td></tr></table><![endif]-->
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
