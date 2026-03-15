<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'trainer_id',
        'client_id',
        'scheduled_at',
        'location',
        'status',
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
