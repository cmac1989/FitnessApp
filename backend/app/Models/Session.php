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
