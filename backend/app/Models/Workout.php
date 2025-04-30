<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Workout extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'difficulty',
        'duration'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sessions()
    {
        return $this->hasMany(Session::class);
    }
    public function exercises()
    {
        return $this->hasMany(Exercise::class);
    }

    public function progressLogs()
    {
        return $this->hasMany(ProgressLog::class);
    }

}
