<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // No action needed.
        // workout_sessions already contains trainer_id.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No action needed.
    }
};
