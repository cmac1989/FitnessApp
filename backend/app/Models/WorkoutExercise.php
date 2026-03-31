<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutExercise extends Model
{
    protected $table = 'workout_exercises';

    protected $fillable = [
        'workout_id',
        'exercise_library_id',
        'order_index',
        'sets',
        'reps',
        'notes',
    ];

    public function workout()
    {
        return $this->belongsTo(Workout::class);
    }

    public function exercise()
    {
        return $this->belongsTo(ExerciseLibrary::class, 'exercise_library_id');
    }
}
