<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutAssignmentComment extends Model
{
    protected $fillable = ['assignment_id', 'user_id', 'body'];

    public function assignment()
    {
        return $this->belongsTo(WorkoutAssignment::class, 'assignment_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reactions()
    {
        return $this->hasMany(WorkoutAssignmentCommentReaction::class, 'comment_id');
    }
}
