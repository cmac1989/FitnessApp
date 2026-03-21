<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientGoal extends Model
{
    protected $fillable = [
        'client_id',
        'type',
        'description',
        'start_value',
        'current_value',
        'target_value',
        'unit',
        'deadline',
        'status',
    ];

    protected $casts = [
        'start_value'   => 'decimal:2',
        'current_value' => 'decimal:2',
        'target_value'  => 'decimal:2',
        'deadline'      => 'date',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function getProgressPercentAttribute(): int
    {
        if ($this->start_value === null || $this->target_value === null || $this->current_value === null) {
            return 0;
        }

        $range = abs((float) $this->target_value - (float) $this->start_value);
        if ($range == 0) return 100;

        $moved = abs((float) $this->current_value - (float) $this->start_value);
        return (int) min(100, round(($moved / $range) * 100));
    }
}
