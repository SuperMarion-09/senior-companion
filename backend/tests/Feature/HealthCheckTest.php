<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_reports_api_and_database_status(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'ok',
                    'database' => 'connected',
                ],
            ])
            ->assertJsonStructure(['success', 'message', 'data' => ['status', 'app', 'database', 'timestamp']]);
    }

    public function test_unknown_api_route_returns_standard_error_shape(): void
    {
        $this->getJson('/api/does-not-exist')
            ->assertNotFound()
            ->assertExactJson([
                'success' => false,
                'message' => 'The requested resource was not found.',
            ]);
    }

    public function test_cors_allows_the_frontend_origin_with_credentials(): void
    {
        $this->withHeader('Origin', 'http://localhost:3000')
            ->getJson('/api/health')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }
}
