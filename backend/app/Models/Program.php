<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $fillable = ['trainer_id', 'title', 'description'];

    public function trainer()
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function workouts()
    {
        return $this->belongsToMany(Workout::class, 'program_workouts', 'program_id', 'workout_id')
            ->withPivot('order_index')
            ->orderBy('program_workouts.order_index');
    }
}
