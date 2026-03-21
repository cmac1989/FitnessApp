<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientMetric extends Model
{
    protected $fillable = [
        'client_id',
        'type',
        'value',
        'unit',
        'notes',
        'recorded_at',
    ];

    protected $casts = [
        'value'       => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }
}
