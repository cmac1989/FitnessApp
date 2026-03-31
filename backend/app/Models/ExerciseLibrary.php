<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExerciseLibrary extends Model
{
    protected $table = 'exercise_library';

    protected $fillable = [
        'external_id',
        'name',
        'body_part',
        'equipment',
        'target',
        'gif_url',
        'secondary_muscles',
        'instructions',
    ];

    protected $casts = [
        'secondary_muscles' => 'array',
        'instructions'      => 'array',
    ];

    public function workoutExercises()
    {
        return $this->hasMany(WorkoutExercise::class);
    }
}
