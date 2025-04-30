<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    protected $fillable = [
        'workout_id',
        'name',
        'description',
        'sets',
        'reps',
        'rest',
        'video_url',
        'image_url'
    ];

    public function workout()
    {
        return $this->belongsTo(Workout::class);
    }
}

//$table->foreignId('workout_id')->constrained('workouts')->onDelete('cascade');
//$table->string('name');
//$table->text('description');
//$table->integer('sets')->nullable();
//$table->integer('reps')->nullable();
//$table->integer('rest')->nullable();
//$table->string('video_url')->nullable();
//$table->string('image_url')->nullable();
