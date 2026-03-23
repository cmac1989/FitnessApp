<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workout_assignments', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable()->after('scheduled_date');
        });

        Schema::create('workout_assignment_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('workout_assignments')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['assignment_id', 'user_id']); // one like per user per assignment
        });

        Schema::create('workout_assignment_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('workout_assignments')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('body');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_assignment_comments');
        Schema::dropIfExists('workout_assignment_reactions');
        Schema::table('workout_assignments', fn (Blueprint $t) => $t->dropColumn('completed_at'));
    }
};
