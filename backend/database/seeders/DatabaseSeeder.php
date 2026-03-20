<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'client@example.com'],
            [
                'name' => 'Test Client',
                'password' => bcrypt('Test1234!'),
                'role' => 'client',
                'bio' => 'Seeded client account for testing.',
            ]
        );

        User::updateOrCreate(
            ['email' => 'trainer@example.com'],
            [
                'name' => 'Test Trainer',
                'password' => bcrypt('Test1234!'),
                'role' => 'trainer',
                'bio' => 'Seeded trainer account for testing.',
            ]
        );
    }
}
