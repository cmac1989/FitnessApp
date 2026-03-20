<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\TrainingSession;
use Illuminate\Support\Facades\Auth;

class ClientDashboardController extends Controller
{
    public function getStats()
    {
        $clientId = Auth::id();

        $sessionsTodayCount = TrainingSession::where('client_id', $clientId)
            ->whereDate('scheduled_at', today())
            ->count();

        $sessionsUpcomingCount = TrainingSession::where('client_id', $clientId)
            ->where('scheduled_at', '>', now())
            ->count();

        $clientProfile = ClientProfile::with('trainer')
            ->where('user_id', $clientId)
            ->first();

        $trainerName = $clientProfile?->trainer?->name ?? null;

        return response()->json([
            'sessions_today'    => $sessionsTodayCount,
            'sessions_upcoming' => $sessionsUpcomingCount,
            'trainer_name'      => $trainerName,
        ]);
    }
}
