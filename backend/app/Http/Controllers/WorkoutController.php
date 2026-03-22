<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\Notification;
use App\Models\Workout;
use App\Models\WorkoutAssignment;
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

    public function assign(Request $request, $id)
    {
        $trainer = Auth::user();

        $workout = Workout::where('id', $id)
            ->where('user_id', $trainer->id)
            ->firstOrFail();

        $request->validate([
            'client_id' => 'required|integer|exists:users,id',
        ]);

        $isLinked = ClientProfile::where('user_id', $request->client_id)
            ->where('trainer_id', $trainer->id)
            ->exists();

        if (!$isLinked) {
            return response()->json(['error' => 'Client is not linked to you.'], 403);
        }

        WorkoutAssignment::firstOrCreate(
            ['workout_id' => $workout->id, 'client_id' => $request->client_id],
            ['trainer_id' => $trainer->id]
        );

        // Notify client
        Notification::create([
            'user_id' => $request->client_id,
            'type'    => 'workout_assigned',
            'data'    => json_encode([
                'title'      => 'New Workout Assigned',
                'body'       => "{$trainer->name} assigned you \"{$workout->title}\".",
                'workout_id' => $workout->id,
            ]),
        ]);

        return response()->json(['message' => 'Workout assigned successfully.']);
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
