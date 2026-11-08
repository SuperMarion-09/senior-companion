<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Admin accounts are not seeded on purpose, so no default password ever
     * exists. Create one with: php artisan admin:create
     */
    public function run(): void
    {
        //
    }
}
