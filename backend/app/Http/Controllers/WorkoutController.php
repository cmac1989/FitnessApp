<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\ExerciseLibrary;
use App\Models\WorkoutExercise;
use Carbon\Carbon;
use App\Models\Notification;
use App\Models\Workout;
use App\Models\WorkoutAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkoutController extends Controller
{
    public function getTrainerWorkouts() {
        $userId = Auth::id();
        $workouts = Workout::where('user_id', $userId)->get();

        return response()->json($workouts);
    }

    public function store(Request $request) {
        $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'duration'    => 'nullable|integer',
            'workout_list'=> 'nullable|string',
            'difficulty'  => 'nullable|string',
            'exercises'   => 'nullable|array',
        ]);

        $userId = Auth::id();

        $workout = Workout::create([
            'user_id'      => $userId,
            'title'        => $request->input('title'),
            'description'  => $request->input('description') ?? null,
            'duration'     => $request->input('duration') ?? null,
            'workout_list' => $request->input('workout_list') ?? null,
            'difficulty'   => $request->input('difficulty') ?? null,
        ]);

        // Attach structured library exercises if provided
        if ($request->has('exercises') && is_array($request->exercises)) {
            foreach ($request->exercises as $i => $ex) {
                $lib = ExerciseLibrary::updateOrCreate(
                    ['external_id' => $ex['external_id'] ?? ''],
                    [
                        'name'              => $ex['name']      ?? '',
                        'body_part'         => $ex['body_part'] ?? '',
                        'equipment'         => $ex['equipment'] ?? '',
                        'target'            => $ex['target']    ?? '',
                        'gif_url'           => $ex['gif_url']   ?? '',
                        'secondary_muscles' => $ex['secondary_muscles'] ?? [],
                        'instructions'      => $ex['instructions']      ?? [],
                    ]
                );

                WorkoutExercise::create([
                    'workout_id'          => $workout->id,
                    'exercise_library_id' => $lib->id,
                    'order_index'         => $ex['order_index'] ?? $i,
                    'sets'                => $ex['sets']  ?? null,
                    'reps'                => $ex['reps']  ?? null,
                    'notes'               => $ex['notes'] ?? null,
                ]);
            }
        }

        return response()->json([
            'message' => 'Workout created successfully.',
            'workout' => $workout,
        ]);
    }

    public function getTrainerWorkout(Request $request, $id) {
        $user = $request->user();

        $workout = Workout::where('id', $id)
            ->where('user_id', $user->id)
            ->with('workoutExercises.exercise')
            ->first();

        if (!$workout) {
            return response()->json(['message' => 'Workout not found or not authorized.'], 404);
        }

        return response()->json($workout);
    }

    public function update(Request $request, Workout $workout) {
        $validatedData = $request->validate([
            'title'        => 'nullable|string',
            'description'  => 'nullable|string',
            'workout_list' => 'nullable|string',
            'difficulty'   => 'nullable|string',
            'duration'     => 'nullable|integer',
            'exercises'    => 'nullable|array',
        ]);

        $workout->update(array_diff_key($validatedData, ['exercises' => null]));

        // Replace structured exercises if provided
        if ($request->has('exercises') && is_array($request->exercises)) {
            WorkoutExercise::where('workout_id', $workout->id)->delete();

            foreach ($request->exercises as $i => $ex) {
                $lib = ExerciseLibrary::updateOrCreate(
                    ['external_id' => $ex['external_id'] ?? ''],
                    [
                        'name'              => $ex['name']      ?? '',
                        'body_part'         => $ex['body_part'] ?? '',
                        'equipment'         => $ex['equipment'] ?? '',
                        'target'            => $ex['target']    ?? '',
                        'gif_url'           => $ex['gif_url']   ?? '',
                        'secondary_muscles' => $ex['secondary_muscles'] ?? [],
                        'instructions'      => $ex['instructions']      ?? [],
                    ]
                );

                WorkoutExercise::create([
                    'workout_id'          => $workout->id,
                    'exercise_library_id' => $lib->id,
                    'order_index'         => $ex['order_index'] ?? $i,
                    'sets'                => $ex['sets']  ?? null,
                    'reps'                => $ex['reps']  ?? null,
                    'notes'               => $ex['notes'] ?? null,
                ]);
            }
        }

        $workout->refresh()->load('workoutExercises.exercise');

        return response()->json([
            'message' => 'Workout updated successfully',
            'workout' => $workout,
        ]);
    }

    public function assign(Request $request, $id)
    {
        $trainer = Auth::user();

        $workout = Workout::where('id', $id)
            ->where('user_id', $trainer->id)
            ->firstOrFail();

        $request->validate([
            'client_id'      => 'required|integer|exists:users,id',
            'scheduled_date' => 'nullable|date|date_format:Y-m-d',
        ]);

        $isLinked = ClientProfile::where('user_id', $request->client_id)
            ->where('trainer_id', $trainer->id)
            ->exists();

        if (!$isLinked) {
            return response()->json(['error' => 'Client is not linked to you.'], 403);
        }

        $scheduledDate = $request->input('scheduled_date');

        $duplicate = WorkoutAssignment::where('workout_id', $workout->id)
            ->where('client_id', $request->client_id)
            ->where('scheduled_date', $scheduledDate)
            ->exists();

        if ($duplicate) {
            return response()->json(['error' => 'This workout is already scheduled for that date.'], 422);
        }

        $assignment = WorkoutAssignment::create([
            'workout_id'     => $workout->id,
            'client_id'      => $request->client_id,
            'trainer_id'     => $trainer->id,
            'scheduled_date' => $scheduledDate,
        ]);

        $dateLabel = $scheduledDate
            ? ' for ' . Carbon::parse($scheduledDate)->format('M j')
            : '';

        Notification::create([
            'user_id' => $request->client_id,
            'type'    => 'workout_assigned',
            'data'    => [
                'message'       => "{$trainer->name} scheduled \"{$workout->title}\"{$dateLabel}.",
                'workout_id'    => $workout->id,
                'assignment_id' => $assignment->id,
                'trainer_name'  => $trainer->name,
                'trainer_id'    => $trainer->id,
            ],
        ]);

        return response()->json(['message' => 'Workout assigned successfully.']);
    }

    public function batchAssign(Request $request, $id)
    {
        $trainer = Auth::user();

        $workout = Workout::where('id', $id)
            ->where('user_id', $trainer->id)
            ->firstOrFail();

        $request->validate([
            'client_ids'     => 'required|array|min:1',
            'client_ids.*'   => 'integer|exists:users,id',
            'scheduled_date' => 'nullable|date|date_format:Y-m-d',
        ]);

        $scheduledDate = $request->input('scheduled_date');
        $created  = 0;
        $skipped  = 0;

        foreach ($request->client_ids as $clientId) {
            $isLinked = ClientProfile::where('user_id', $clientId)
                ->where('trainer_id', $trainer->id)
                ->exists();

            if (!$isLinked) {
                $skipped++;
                continue;
            }

            $duplicate = WorkoutAssignment::where('workout_id', $workout->id)
                ->where('client_id', $clientId)
                ->where('scheduled_date', $scheduledDate)
                ->exists();

            if ($duplicate) {
                $skipped++;
                continue;
            }

            $assignment = WorkoutAssignment::create([
                'workout_id'     => $workout->id,
                'client_id'      => $clientId,
                'trainer_id'     => $trainer->id,
                'scheduled_date' => $scheduledDate,
            ]);

            $dateLabel = $scheduledDate
                ? ' for ' . Carbon::parse($scheduledDate)->format('M j')
                : '';

            Notification::create([
                'user_id' => $clientId,
                'type'    => 'workout_assigned',
                'data'    => [
                    'message'       => "{$trainer->name} scheduled \"{$workout->title}\"{$dateLabel}.",
                    'workout_id'    => $workout->id,
                    'assignment_id' => $assignment->id,
                    'trainer_name'  => $trainer->name,
                    'trainer_id'    => $trainer->id,
                ],
            ]);

            $created++;
        }

        return response()->json([
            'message' => "Assigned to {$created} client(s)." . ($skipped > 0 ? " {$skipped} skipped (already assigned or not linked)." : ''),
            'created' => $created,
            'skipped' => $skipped,
        ]);
    }

    public function clientSchedule()
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $assignments = WorkoutAssignment::with('workout.workoutExercises.exercise')
            ->where('client_id', $user->id)
            ->orderByRaw('scheduled_date IS NULL ASC')
            ->orderBy('scheduled_date', 'asc')
            ->get()
            ->map(fn ($a) => [
                'id'             => $a->id,
                'scheduled_date' => $a->scheduled_date?->format('Y-m-d'),
                'workout'        => $a->workout,
            ]);

        return response()->json(['schedule' => $assignments]);
    }

    public function destroy($id) {
        $workout = Workout::find($id);

        if (!$workout) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $workout->delete();
        return response()->json(['message' => 'Workout deleted successfully']);
    }
}
