<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Requests from the React app's origin get session (cookie) handling.
        $this->withHeader('Origin', 'http://localhost:3000');
    }

    public function test_admin_can_log_in_with_correct_credentials(): void
    {
        $admin = Admin::factory()->create(['email' => 'admin@example.com']);

        $this->postJson('/api/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'data' => ['admin' => ['id' => $admin->id, 'email' => 'admin@example.com']],
            ])
            ->assertJsonMissingPath('data.admin.password');

        $this->assertAuthenticatedAs($admin, 'web');
        $this->assertNotNull($admin->fresh()->last_login_at);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        Admin::factory()->create(['email' => 'admin@example.com']);

        $this->postJson('/api/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])
            ->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest('web');
    }

    public function test_login_rejects_non_string_credentials(): void
    {
        $this->postJson('/api/admin/login', [
            'email' => ['admin@example.com'],
            'password' => ['password'],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_is_rate_limited(): void
    {
        Admin::factory()->create(['email' => 'admin@example.com']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/login', ['email' => 'admin@example.com', 'password' => 'nope']);
        }

        $this->postJson('/api/admin/login', ['email' => 'admin@example.com', 'password' => 'password'])
            ->assertStatus(429)
            ->assertJson(['success' => false]);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/admin/me')
            ->assertUnauthorized()
            ->assertExactJson([
                'success' => false,
                'message' => 'You must be logged in to do that.',
            ]);
    }

    public function test_logged_in_admin_can_fetch_their_profile_and_log_out(): void
    {
        $admin = Admin::factory()->create();

        $this->actingAs($admin, 'web')
            ->getJson('/api/admin/me')
            ->assertOk()
            ->assertJsonPath('data.admin.email', $admin->email);

        $this->postJson('/api/admin/logout')
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertGuest('web');
    }
}
