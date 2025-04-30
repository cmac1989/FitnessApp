<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    protected $fillable = [
        'client_id',
        'trainer_id',
        'workout_id',
        'scheduled_at',
        'status',
        'notes'
    ];

    public function workout()
    {
        return $this->belongsTo(Workout::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function trainer()
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }
}

//$table->foreignId('client_id')->constrained('users')->onDelete('cascade');
//$table->foreignId('trainer_id')->constrained('users')->onDelete('cascade');
//$table->foreignId('workout_id')->nullable()->constrained('workouts')->onDelete('set null');
//$table->timestamp('scheduled_at');
//$table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('pending');
//$table->text('notes')->nullable();
