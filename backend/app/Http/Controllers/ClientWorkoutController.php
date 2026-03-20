<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\Workout;
use Illuminate\Support\Facades\Auth;

class ClientWorkoutController extends Controller
{
    public function index()
    {
        if (auth()->user()->role !== 'client') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $clientId = Auth::id();
        $clientProfile = ClientProfile::where('user_id', $clientId)->first();

        if (!$clientProfile || !$clientProfile->trainer_id) {
            return response()->json([]);
        }

        $workouts = Workout::where('user_id', $clientProfile->trainer_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($workouts);
    }

    public function show($id)
    {
        if (auth()->user()->role !== 'client') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $clientId = Auth::id();
        $clientProfile = ClientProfile::where('user_id', $clientId)->first();

        if (!$clientProfile || !$clientProfile->trainer_id) {
            return response()->json(['error' => 'Workout not found'], 404);
        }

        $workout = Workout::where('id', $id)
            ->where('user_id', $clientProfile->trainer_id)
            ->first();

        if (!$workout) {
            return response()->json(['error' => 'Workout not found'], 404);
        }

        return response()->json($workout);
    }
}
