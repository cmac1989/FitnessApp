<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // weight_loss, strength, endurance, body_composition, custom
            $table->string('description')->nullable();
            $table->decimal('start_value', 8, 2)->nullable();
            $table->decimal('current_value', 8, 2)->nullable();
            $table->decimal('target_value', 8, 2)->nullable();
            $table->string('unit')->nullable(); // lbs, kg, %, reps
            $table->date('deadline')->nullable();
            $table->string('status')->default('active'); // active, completed, paused
            $table->timestamps();

            $table->index('client_id');
            $table->index(['client_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_goals');
    }
};
