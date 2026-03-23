<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutAssignment extends Model
{
    protected $fillable = [
        'workout_id', 'client_id', 'trainer_id',
        'scheduled_date', 'completed_at',
    ];

    protected $casts = [
        'scheduled_date' => 'date:Y-m-d',
        'completed_at'   => 'datetime',
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

    public function reactions()
    {
        return $this->hasMany(WorkoutAssignmentReaction::class, 'assignment_id');
    }

    public function comments()
    {
        return $this->hasMany(WorkoutAssignmentComment::class, 'assignment_id');
    }
}
