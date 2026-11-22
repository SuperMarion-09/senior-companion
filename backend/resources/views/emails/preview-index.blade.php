{{-- Developer list of email templates at /email-previews (local only). --}}
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kaagapay email previews</title>
    <style>
        body { margin: 0; padding: 32px 16px; background: #fbf8f1; color: #2e3333; font: 17px/1.6 'Atkinson Hyperlegible', system-ui, sans-serif; }
        main { max-width: 760px; margin: 0 auto; }
        h1, h2 { font-family: 'Source Serif 4', Georgia, serif; }
        h2 { margin-top: 32px; font-size: 1.25rem; }
        ul { padding: 0; list-style: none; }
        li { padding: 10px 0; border-top: 1px solid #e6e0d2; }
        a { color: #3d5843; font-weight: 700; }
        small { color: #5a605e; }
        code { background: #f3efe5; padding: 2px 6px; border-radius: 6px; }
    </style>
</head>
<body>
<main>
    <h1>Kaagapay email previews</h1>
    <p>Every template with sample data, exactly as it is sent. Add <code>?scenario=minimal</code>, <code>?status=pending</code> or <code>?format=text</code> to the address. Admins can also use the <strong>Email templates</strong> page in the admin area.</p>
    @foreach ($categories as $category)
        <h2>{{ $category }}</h2>
        <ul>
            @foreach ($templates as $template)
                @continue($template->category !== $category)
                <li>
                    <a href="{{ route('email-previews.show', $template->key) }}">{{ $template->name }}</a>
                    &middot; <a href="{{ route('email-previews.show', [$template->key, 'format' => 'text']) }}">plain text</a><br>
                    <small>{{ $template->description }}</small>
                </li>
            @endforeach
        </ul>
    @endforeach
</main>
</body>
</html>
