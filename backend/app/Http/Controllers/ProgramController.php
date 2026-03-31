<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\Notification;
use App\Models\Program;
use App\Models\Workout;
use App\Models\WorkoutAssignment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProgramController extends Controller
{
    /**
     * List all programs for the authenticated trainer.
     */
    public function index()
    {
        $trainer  = Auth::user();
        $programs = Program::where('trainer_id', $trainer->id)
            ->withCount('workouts')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($programs);
    }

    /**
     * Create a new program (optionally with an initial ordered workout list).
     */
    public function store(Request $request)
    {
        $trainer = Auth::user();

        $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string',
            'workout_ids'   => 'nullable|array',
            'workout_ids.*' => 'integer|exists:workouts,id',
        ]);

        $program = Program::create([
            'trainer_id'  => $trainer->id,
            'title'       => $request->title,
            'description' => $request->description,
        ]);

        if ($request->filled('workout_ids')) {
            foreach ($request->workout_ids as $index => $workoutId) {
                $program->workouts()->attach($workoutId, ['order_index' => $index]);
            }
        }

        return response()->json([
            'message' => 'Program created successfully.',
            'program' => $program->loadCount('workouts')->load('workouts'),
        ], 201);
    }

    /**
     * Get a single program with its ordered workouts.
     */
    public function show($id)
    {
        $trainer = Auth::user();

        $program = Program::where('id', $id)
            ->where('trainer_id', $trainer->id)
            ->with('workouts')
            ->firstOrFail();

        return response()->json($program);
    }

    /**
     * Update program details and/or sync its workouts.
     */
    public function update(Request $request, $id)
    {
        $trainer = Auth::user();

        $program = Program::where('id', $id)
            ->where('trainer_id', $trainer->id)
            ->firstOrFail();

        $request->validate([
            'title'         => 'sometimes|required|string|max:255',
            'description'   => 'nullable|string',
            'workout_ids'   => 'nullable|array',
            'workout_ids.*' => 'integer|exists:workouts,id',
        ]);

        $program->update($request->only(['title', 'description']));

        if ($request->has('workout_ids')) {
            $program->workouts()->detach();
            foreach ($request->workout_ids as $index => $workoutId) {
                $program->workouts()->attach($workoutId, ['order_index' => $index]);
            }
        }

        return response()->json([
            'message' => 'Program updated.',
            'program' => $program->refresh()->load('workouts')->loadCount('workouts'),
        ]);
    }

    /**
     * Delete a program.
     */
    public function destroy($id)
    {
        $trainer = Auth::user();

        $program = Program::where('id', $id)
            ->where('trainer_id', $trainer->id)
            ->firstOrFail();

        $program->delete();

        return response()->json(['message' => 'Program deleted.']);
    }

    /**
     * Assign all workouts in a program to multiple clients.
     * Each workout is offset by its order_index (days from start_date).
     */
    public function batchAssign(Request $request, $id)
    {
        $trainer = Auth::user();

        $program = Program::where('id', $id)
            ->where('trainer_id', $trainer->id)
            ->with('workouts')
            ->firstOrFail();

        $request->validate([
            'client_ids'   => 'required|array|min:1',
            'client_ids.*' => 'integer|exists:users,id',
            'start_date'   => 'nullable|date|date_format:Y-m-d',
        ]);

        $startDate = $request->start_date ? Carbon::parse($request->start_date) : null;
        $created   = 0;
        $skipped   = 0;

        foreach ($request->client_ids as $clientId) {
            $isLinked = ClientProfile::where('user_id', $clientId)
                ->where('trainer_id', $trainer->id)
                ->exists();

            if (!$isLinked) {
                $skipped++;
                continue;
            }

            foreach ($program->workouts as $index => $workout) {
                $scheduledDate = $startDate
                    ? $startDate->copy()->addDays($index)->format('Y-m-d')
                    : null;

                $duplicate = WorkoutAssignment::where('workout_id', $workout->id)
                    ->where('client_id', $clientId)
                    ->where('scheduled_date', $scheduledDate)
                    ->exists();

                if ($duplicate) {
                    $skipped++;
                    continue;
                }

                WorkoutAssignment::create([
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
                        'message'      => "{$trainer->name} added \"{$workout->title}\" from program \"{$program->title}\"{$dateLabel}.",
                        'workout_id'   => $workout->id,
                        'trainer_name' => $trainer->name,
                        'trainer_id'   => $trainer->id,
                    ],
                ]);

                $created++;
            }
        }

        $noun = $created === 1 ? 'workout' : 'workouts';

        return response()->json([
            'message' => "Assigned {$created} {$noun} from \"{$program->title}\"."
                . ($skipped > 0 ? " {$skipped} skipped (duplicate or unlinked)." : ''),
            'created' => $created,
            'skipped' => $skipped,
        ]);
    }
}
