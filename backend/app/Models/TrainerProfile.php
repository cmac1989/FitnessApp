<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'certifications',
        'years_experience',
        'specialties',
        'bio',
        'availability',
        'location'
    ];

    protected $casts = [
        'specialties' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

}
