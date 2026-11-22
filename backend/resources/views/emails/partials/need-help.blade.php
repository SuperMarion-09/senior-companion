{{-- "Need to change something?" with the phone number. Uses $brand from the layout data. --}}
<x-email.text muted small>
    Need to change something, or have a question? Call or text us at
    <a href="{{ $brand['support_phone_href'] }}" style="color:#3d5843; font-weight:700; text-decoration:underline;">{{ $brand['support_phone'] }}</a>
    ({{ $brand['support_hours'] }}) or simply reply to this email. A real person will help you.
</x-email.text>
