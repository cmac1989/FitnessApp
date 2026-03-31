<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Make legacy required columns nullable so structured-exercise workouts
        // don't need workout_list / duration / description.
        // Also widen difficulty from enum to varchar so any case works.
        DB::statement("ALTER TABLE workouts
            MODIFY COLUMN description TEXT NULL,
            MODIFY COLUMN duration INT NULL,
            MODIFY COLUMN workout_list VARCHAR(500) NULL,
            MODIFY COLUMN difficulty VARCHAR(50) NULL
        ");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE workouts
            MODIFY COLUMN description TEXT NOT NULL,
            MODIFY COLUMN duration INT NOT NULL,
            MODIFY COLUMN workout_list VARCHAR(255) NOT NULL,
            MODIFY COLUMN difficulty ENUM('beginner','intermediate','advanced') NOT NULL
        ");
    }
};
