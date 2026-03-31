<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workout_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_id')->constrained('workouts')->onDelete('cascade');
            $table->foreignId('exercise_library_id')->constrained('exercise_library')->onDelete('cascade');
            $table->unsignedSmallInteger('order_index')->default(0);
            $table->string('sets')->nullable();
            $table->string('reps')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_exercises');
    }
};
