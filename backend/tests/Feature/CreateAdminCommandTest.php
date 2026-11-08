<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_admin_with_a_hashed_password(): void
    {
        $this->artisan('admin:create')
            ->expectsQuestion('Admin name', 'Jane Admin')
            ->expectsQuestion('Admin email', 'jane@example.com')
            ->expectsQuestion('Password', 'Secure-Pass-2026')
            ->expectsQuestion('Confirm password', 'Secure-Pass-2026')
            ->expectsOutputToContain('Admin account created')
            ->assertSuccessful();

        $admin = Admin::where('email', 'jane@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('Secure-Pass-2026', $admin->password));
    }

    public function test_it_rejects_a_weak_password(): void
    {
        $this->artisan('admin:create')
            ->expectsQuestion('Admin name', 'Jane Admin')
            ->expectsQuestion('Admin email', 'jane@example.com')
            ->expectsQuestion('Password', 'short')
            ->expectsQuestion('Confirm password', 'short')
            ->assertFailed();

        $this->assertDatabaseMissing('admins', ['email' => 'jane@example.com']);
    }
}
