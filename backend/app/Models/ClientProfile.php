<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'age',
        'gender',
        'fitness_goals',
        'medical_conditions'

    ];

    public function user() {
        return $this->belongsTo(User::class);
    }
}
