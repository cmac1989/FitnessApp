<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutAssignmentReaction extends Model
{
    protected $fillable = ['assignment_id', 'user_id'];

    public function assignment()
    {
        return $this->belongsTo(WorkoutAssignment::class, 'assignment_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
