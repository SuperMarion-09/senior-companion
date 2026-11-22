<?php

namespace Tests\Feature;

use App\Mail\KaagapayMail;
use App\Mail\Templates\EmailRenderer;
use App\Mail\Templates\EmailTemplates;
use App\Mail\Templates\SampleData;
use App\Models\Admin;
use App\Models\Booking;
use App\Notifications\BookingStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Mail;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class EmailTemplatesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function templateScenarios(): array
    {
        $cases = [];
        foreach (array_keys(EmailTemplates::all()) as $key) {
            foreach (array_keys(SampleData::scenarios($key)) as $scenario) {
                $cases["{$key} / {$scenario}"] = [$key, $scenario];
            }
        }

        return $cases;
    }

    public function test_there_are_22_templates_each_with_a_view(): void
    {
        $this->assertCount(22, EmailTemplates::all());

        foreach (EmailTemplates::all() as $template) {
            $this->assertTrue(view()->exists($template->view()), "Missing view for {$template->key}");
            $this->assertContains($template->category, EmailTemplates::CATEGORIES);
            $this->assertEmpty(array_intersect($template->variableNames(), EmailTemplates::RESERVED), "{$template->key} uses a reserved name");
        }
    }

    #[DataProvider('templateScenarios')]
    public function test_every_template_renders_cleanly(string $key, string $scenario): void
    {
        $email = app(EmailRenderer::class)->render($key, SampleData::for($key, $scenario));

        $this->assertNotSame('', $email->subject);
        $this->assertStringNotContainsString('{{', $email->subject.$email->preheader.$email->html, 'Unfilled placeholder');
        $this->assertStringContainsString('<h1', $email->html);
        $this->assertStringContainsString(e($email->preheader), $email->html);
        $this->assertStringContainsString('Privacy Policy', $email->html);
        $this->assertStringContainsString('In an emergency, always call 911 first.', $email->text);
        // Gmail cuts off emails over 102 KB.
        $this->assertLessThan(90 * 1024, strlen($email->html));
        // Every link goes somewhere real.
        $this->assertDoesNotMatchRegularExpression('/href="(#|)"/', $email->html);
    }

    public function test_missing_required_data_is_reported(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('verification_link');

        app(EmailRenderer::class)->render('email-verification', ['customer_name' => 'Ana']);
    }

    public function test_optional_sections_are_hidden_without_data(): void
    {
        $full = app(EmailRenderer::class)->render('booking-approved', SampleData::for('booking-approved'));
        $minimal = app(EmailRenderer::class)->render('booking-approved', SampleData::for('booking-approved', 'minimal'));

        $this->assertStringContainsString('Joy Mercado', $full->html);
        $this->assertStringNotContainsString('Your companion</td>', $minimal->html);
        $this->assertStringContainsString('Your loved one', $minimal->preheader);
    }

    public function test_values_are_escaped(): void
    {
        $data = ['customer_name' => '<script>alert(1)</script>'] + SampleData::for('welcome');
        $email = app(EmailRenderer::class)->render('welcome', $data);

        $this->assertStringNotContainsString('<script>', $email->html);
        $this->assertStringContainsString('&lt;script&gt;', $email->html);
    }

    public function test_only_marketing_emails_have_unsubscribe(): void
    {
        $promo = new KaagapayMail('promotional', SampleData::for('promotional'));
        $this->assertStringContainsString('Unsubscribe', $promo->rendered()->html);
        $this->assertArrayHasKey('List-Unsubscribe', $promo->headers()->text);

        $reminder = new KaagapayMail('booking-reminder', SampleData::for('booking-reminder'));
        $this->assertStringNotContainsString('Unsubscribe', $reminder->rendered()->html);
        $this->assertSame([], $reminder->headers()->text);
    }

    public function test_sent_email_has_html_text_and_reply_to(): void
    {
        Mail::to('family@example.com')->send(new KaagapayMail('booking-reminder', SampleData::for('booking-reminder')));

        $message = app('mailer')->getSymfonyTransport()->messages()->first()->getOriginalMessage();

        $this->assertSame("Reminder: Lola Remedios's visit is tomorrow", $message->getSubject());
        $this->assertStringContainsString('<!doctype html>', $message->getHtmlBody());
        $this->assertStringContainsString('Start time: 8:00 AM', $message->getTextBody());
        $this->assertSame(config('kaagapay.contact_email'), $message->getReplyTo()[0]->getAddress());
    }

    public function test_status_notification_uses_the_branded_templates(): void
    {
        $booking = Booking::factory()->status('confirmed')->create([
            'contact_person_name' => 'Ana Reyes',
            'client_name' => 'Remedios Reyes',
            'service_type' => 'walking',
            'email' => 'family@example.com',
        ]);
        $notifiable = (new AnonymousNotifiable)->route('mail', ['family@example.com' => 'Ana Reyes']);

        $mail = (new BookingStatusChanged($booking, 'See you soon!'))->toMail($notifiable);

        $this->assertInstanceOf(KaagapayMail::class, $mail);
        $this->assertSame('booking-approved', $mail->template);
        $this->assertTrue($mail->hasTo('family@example.com', 'Ana Reyes'));
        $this->assertStringContainsString($booking->reference, $mail->rendered()->subject);
        $this->assertStringContainsString('Walking Companion', $mail->rendered()->html);
        $this->assertStringContainsString('See you soon!', $mail->rendered()->html);

        $booking->status = 'rejected';
        $this->assertSame('booking-rejected', (new BookingStatusChanged($booking, 'Fully booked.'))->toMail($notifiable)->template);
        $booking->status = 'cancelled';
        $this->assertSame('booking-cancellation', (new BookingStatusChanged($booking))->toMail($notifiable)->template);
    }

    public function test_preview_api_needs_login(): void
    {
        $this->withHeader('Origin', 'http://localhost:3000');

        $this->getJson('/api/admin/email-templates')->assertUnauthorized();
        $this->postJson('/api/admin/email-templates/welcome/preview')->assertUnauthorized();
    }

    public function test_admins_can_list_and_preview_templates(): void
    {
        $this->withHeader('Origin', 'http://localhost:3000');
        $admin = Admin::factory()->create();

        $this->actingAs($admin)->getJson('/api/admin/email-templates')
            ->assertOk()
            ->assertJsonCount(22, 'data.templates')
            ->assertJsonCount(4, 'data.categories')
            ->assertJsonPath('data.templates.0.key', 'welcome');

        $this->actingAs($admin)->postJson('/api/admin/email-templates/booking-confirmation/preview', [
            'scenario' => 'default',
            'booking_status' => 'pending',
            'data' => ['customer_name' => 'Maria Santos', 'not_a_variable' => 'ignored'],
        ])
            ->assertOk()
            ->assertJsonPath('data.data.booking_status', 'pending')
            ->assertJsonPath('data.data.customer_name', 'Maria Santos')
            ->assertJsonMissingPath('data.data.not_a_variable')
            ->assertSee('Waiting for confirmation');

        $this->actingAs($admin)->postJson('/api/admin/email-templates/welcome/preview', ['data' => ['customer_name' => '']])
            ->assertUnprocessable();

        $this->actingAs($admin)->postJson('/api/admin/email-templates/nope/preview')->assertNotFound();
    }
}
