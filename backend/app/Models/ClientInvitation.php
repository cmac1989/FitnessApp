<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientInvitation extends Model
{
    protected $fillable = [
        'trainer_id',
        'client_id',
        'token',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function trainer()
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
