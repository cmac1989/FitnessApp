<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // weight, waist, body_fat, hip, chest, bicep, squat_pr, bench_pr
            $table->decimal('value', 8, 2);
            $table->string('unit')->default('lbs'); // lbs, kg, cm, in, %
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();

            $table->index(['client_id', 'type']);
            $table->index(['client_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_metrics');
    }
};
