<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutAssignment extends Model
{
    protected $fillable = ['workout_id', 'client_id', 'trainer_id'];

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
