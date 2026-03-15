<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\TrainingSession;
use App\Models\Workout;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TrainerDashboardController extends Controller
{
    public function getStats()
    {
        $trainerId = Auth::id();

        Log::info('Authenticated trainer ID: ' . $trainerId);

        $clientCount = ClientProfile::where('trainer_id', $trainerId)->count();

        $sessionsTodayCount = TrainingSession::where('trainer_id', $trainerId)
            ->whereDate('scheduled_at', today())
            ->count();

        $plansCount = Workout::where('user_id', $trainerId)->count();

        return response()->json([
            'clients' => $clientCount,
            'sessions_today' => $sessionsTodayCount,
            'total_plans' => $plansCount,
        ]);
    }
}
