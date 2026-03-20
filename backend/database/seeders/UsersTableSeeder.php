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
        User::factory()->create([
            'name' => 'Test Client',
            'email' => 'client@example.com',
            'password' => bcrypt('Test1234!'),
            'role' => 'client',
            'bio' => 'Seeded client account for testing.',
        ]);

        User::factory()->create([
            'name' => 'Test Trainer',
            'email' => 'trainer@example.com',
            'password' => bcrypt('Test1234!'),
            'role' => 'trainer',
            'bio' => 'Seeded trainer account for testing.',
        ]);
    }
}
