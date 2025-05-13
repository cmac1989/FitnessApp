<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profile_picture',
        'bio',
    ];

    /**
     * The attributes that should be hidden for arrays and JSON responses.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function clientProfile() {
        return $this->hasOne(ClientProfile::class);
    }

    public function clients()
    {
        return $this->hasMany(ClientProfile::class, 'trainer_id');
    }

    public function trainingSession()
    {
        return $this->hasMany(TrainingSession::class, 'client_id');
    }

    public function clientSessions()
    {
        return $this->hasMany(Session::class, 'client_id');
    }

    public function trainerProfile()
    {
        return $this->hasOne(TrainerProfile::class, 'user_id'); // Assuming the trainer profile is a separate table
    }

    public function progressLogs()
    {
        return $this->hasMany(ProgressLog::class, 'client_id');
    }

    public function trainerSessions()
    {
        return $this->hasMany(Session::class, 'trainer_id');
    }

     public function messagesSent()
     {
         return $this->hasMany(Message::class, 'sender_id');
     }

     public function messagesReceived()
     {
         return $this->hasMany(Message::class, 'receiver_id');
     }

     public function trainerMessages()
     {
         return $this->hasMany(Message::class, 'trainer_id');
     }
}
