<?php

namespace App\Http\Controllers;

use App\Models\Workout;
use App\Models\WorkoutAssignment;
use Illuminate\Support\Facades\Auth;

class ClientWorkoutController extends Controller
{
    public function index()
    {
        $clientId = Auth::id();

        $workouts = Workout::whereHas('assignments', fn ($q) => $q->where('client_id', $clientId))
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($workouts);
    }

    public function show($id)
    {
        $clientId = Auth::id();

        $workout = Workout::where('id', $id)
            ->whereHas('assignments', fn ($q) => $q->where('client_id', $clientId))
            ->first();

        if (!$workout) {
            return response()->json(['error' => 'Workout not found'], 404);
        }

        return response()->json($workout);
    }
}
