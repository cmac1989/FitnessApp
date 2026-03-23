<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('check_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('trainer_id')->constrained('users')->onDelete('cascade');
            $table->date('week_start');
            $table->decimal('weight', 6, 2)->nullable();
            $table->string('weight_unit', 3)->default('lbs');
            $table->tinyInteger('adherence_score')->nullable(); // 1-10
            $table->tinyInteger('energy_score')->nullable();    // 1-10
            $table->text('client_notes')->nullable();
            $table->text('trainer_feedback')->nullable();
            $table->text('trainer_adjustments')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['client_id', 'week_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_ins');
    }
};
