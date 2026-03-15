<?php

namespace App\Http\Controllers;

use App\Models\Workout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkoutController extends Controller
{
    public function getTrainerWorkouts() {
        $userId = Auth::id();
        $workouts = Workout::where('user_id', $userId) ->get();

        return response()->json($workouts);
    }

    public function store(Request $request) {
        $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'duration' => 'required|integer',
            'workout_list' => 'required|string',
            'difficulty' => 'nullable|string'
        ]);

        $userId = Auth::id();

        $workout = Workout::create([
            'user_id' => $userId,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'duration' => $request->input('duration'),
            'workout_list' => $request->input('workout_list'),
            'difficulty' => $request->input('difficulty') ?? 'Medium'
        ]);

        return response()->json([
            'message' => 'Workout created successfully.',
            'workout' => $workout
        ]);
    }

    public function getTrainerWorkout(Request $request, $id) {
        $user = $request->user();

        $workout = Workout::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$workout) {
            return response()->json(['message' => 'Workout not found or not authorized.'], 404);
        }

        return response()->json($workout);
    }

    public function update(Request $request, Workout $workout) {
        $validatedData = $request->validate([
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'workout_list' => 'nullable|string',
            'difficulty' => 'nullable|string',
            'duration' => 'nullable|integer'
        ]);

        $workout->update($validatedData);
        $workout->refresh();

        return response()->json([
            'message' => 'Workout updated successfully',
            'workout' => $workout
        ]);
    }

    public function destroy($id) {
        $workout = Workout::find($id);

        if(!$workout) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $workout->delete();
        return response()->json(['message' => 'Workout deleted successfully']);
    }
}
