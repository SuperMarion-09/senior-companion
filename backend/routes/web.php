<?php

use App\Mail\Templates\EmailRenderer;
use App\Mail\Templates\EmailTemplates;
use App\Mail\Templates\SampleData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// The backend is an API only; the website itself is the React app.
Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'message' => 'Senior Companion API. Check GET /api/health to verify it is running.',
    ]);
});

/*
| Email previews for developers: the raw email HTML exactly as it is sent,
| with sample data. Open it in a browser, or paste it into an email testing
| tool. Only when kaagapay.email.previews is on (local by default); admins on
| the live site use the Email templates page instead.
|   /email-previews                          list of templates
|   /email-previews/booking-reminder?scenario=today&status=confirmed
|   /email-previews/booking-reminder?format=text   the plain-text version
*/
if (config('kaagapay.email.previews')) {
    Route::get('/email-previews', function () {
        return view('emails.preview-index', [
            'templates' => EmailTemplates::all(),
            'categories' => EmailTemplates::CATEGORIES,
        ]);
    })->name('email-previews.index');

    Route::get('/email-previews/{template}', function (Request $request, string $template, EmailRenderer $renderer) {
        abort_unless(EmailTemplates::has($template), 404);

        $email = $renderer->render($template, SampleData::forPreview(
            $template,
            (string) $request->query('scenario', 'default'),
            $request->query('status'),
        ));

        return $request->query('format') === 'text'
            ? response($email->text, 200, ['Content-Type' => 'text/plain; charset=utf-8'])
            : response($email->html);
    })->where('template', '[a-z0-9-]+')->name('email-previews.show');
}
