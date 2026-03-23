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
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->string('gender', 50)->nullable()->change();
            $table->integer('age')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->enum('gender', ['M', 'F', 'O'])->nullable()->change();
            $table->integer('age')->nullable(false)->change();
        });
    }
};
