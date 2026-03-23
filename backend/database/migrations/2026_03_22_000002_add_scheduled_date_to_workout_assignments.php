<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workout_assignments', function (Blueprint $table) {
            if (!$this->hasColumn('scheduled_date')) {
                $table->date('scheduled_date')->nullable()->after('trainer_id');
            }
        });

        Schema::table('workout_assignments', function (Blueprint $table) {
            // Drop old composite unique if it still exists
            if ($this->hasIndex('workout_assignments_workout_id_client_id_unique')) {
                $table->dropUnique(['workout_id', 'client_id']);
            }

            // Add new three-column unique if not already there
            if (!$this->hasIndex('wa_workout_client_date_unique')) {
                $table->unique(['workout_id', 'client_id', 'scheduled_date'], 'wa_workout_client_date_unique');
            }

            if (!$this->hasIndex('wa_client_date_idx')) {
                $table->index(['client_id', 'scheduled_date'], 'wa_client_date_idx');
            }

            // Drop the temporary single-column workout_id index if it exists
            if ($this->hasIndex('wa_workout_id_idx')) {
                $table->dropIndex('wa_workout_id_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('workout_assignments', function (Blueprint $table) {
            $table->unique(['workout_id', 'client_id']);
        });

        Schema::table('workout_assignments', function (Blueprint $table) {
            if ($this->hasIndex('wa_client_date_idx')) {
                $table->dropIndex('wa_client_date_idx');
            }
            if ($this->hasIndex('wa_workout_client_date_unique')) {
                $table->dropUnique('wa_workout_client_date_unique');
            }
            if ($this->hasColumn('scheduled_date')) {
                $table->dropColumn('scheduled_date');
            }
        });
    }

    private function hasColumn(string $column): bool
    {
        return Schema::hasColumn('workout_assignments', $column);
    }

    private function hasIndex(string $indexName): bool
    {
        $indexes = \Illuminate\Support\Facades\DB::select(
            "SHOW INDEX FROM workout_assignments WHERE Key_name = ?",
            [$indexName]
        );
        return count($indexes) > 0;
    }
};
