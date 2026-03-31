<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercise_library', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->unique();   // ExerciseDB id (e.g. "0001")
            $table->string('name');
            $table->string('body_part');
            $table->string('equipment');
            $table->string('target');
            $table->string('gif_url');
            $table->json('secondary_muscles')->nullable();
            $table->json('instructions')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercise_library');
    }
};
