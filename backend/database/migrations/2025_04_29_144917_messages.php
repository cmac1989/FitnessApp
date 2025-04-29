<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('trainer_id')->nullable()->constrained('users')->onDelete('set null');  // Add trainer_id column
            $table->timestamp('scheduled_at')->nullable();  // Add scheduled_at column
            $table->text('content');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['trainer_id', 'scheduled_at']);
            $table->index(['receiver_id', 'scheduled_at']);  // Change client_id to receiver_id as per existing foreign key
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
