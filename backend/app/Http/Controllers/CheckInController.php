<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Models\ClientProfile;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckInController extends Controller
{
    /**
     * Client: list their own check-ins, ordered by week_start desc.
     */
    public function clientIndex()
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $checkIns = CheckIn::where('client_id', $user->id)
            ->orderBy('week_start', 'desc')
            ->get();

        return response()->json(['check_ins' => $checkIns], 200);
    }

    /**
     * Client: submit a check-in for the current week.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $clientProfile = ClientProfile::where('user_id', $user->id)->first();

        if (!$clientProfile || !$clientProfile->trainer_id) {
            return response()->json(['message' => 'You do not have a linked trainer.'], 422);
        }

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();

        $existing = CheckIn::where('client_id', $user->id)
            ->where('week_start', $weekStart)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already submitted a check-in for this week.'], 422);
        }

        $validated = $request->validate([
            'weight'           => 'nullable|numeric|min:0',
            'weight_unit'      => 'nullable|string|in:lbs,kg',
            'adherence_score'  => 'nullable|integer|min:1|max:10',
            'energy_score'     => 'nullable|integer|min:1|max:10',
            'client_notes'     => 'nullable|string|max:2000',
        ]);

        $checkIn = CheckIn::create([
            'client_id'       => $user->id,
            'trainer_id'      => $clientProfile->trainer_id,
            'week_start'      => $weekStart,
            'weight'          => $validated['weight'] ?? null,
            'weight_unit'     => $validated['weight_unit'] ?? 'lbs',
            'adherence_score' => $validated['adherence_score'] ?? null,
            'energy_score'    => $validated['energy_score'] ?? null,
            'client_notes'    => $validated['client_notes'] ?? null,
            'submitted_at'    => Carbon::now(),
        ]);

        // Notify the trainer
        Notification::create([
            'user_id' => $clientProfile->trainer_id,
            'type'    => 'check_in_submitted',
            'data'    => [
                'check_in_id' => $checkIn->id,
                'client_id'   => $user->id,
                'client_name' => $user->name,
                'week_start'  => $weekStart,
                'message'     => "{$user->name} submitted their weekly check-in.",
            ],
        ]);

        return response()->json(['check_in' => $checkIn], 201);
    }

    /**
     * Client: view one check-in with weight_change vs previous week.
     */
    public function show($id)
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $checkIn = CheckIn::where('id', $id)
            ->where('client_id', $user->id)
            ->first();

        if (!$checkIn) {
            return response()->json(['message' => 'Check-in not found.'], 404);
        }

        $weightChange = null;

        if ($checkIn->weight !== null) {
            $previous = CheckIn::where('client_id', $user->id)
                ->where('week_start', '<', $checkIn->week_start)
                ->whereNotNull('weight')
                ->orderBy('week_start', 'desc')
                ->first();

            if ($previous && $previous->weight !== null) {
                $weightChange = round((float) $checkIn->weight - (float) $previous->weight, 2);
            }
        }

        return response()->json([
            'check_in'     => $checkIn,
            'weight_change' => $weightChange,
        ], 200);
    }

    /**
     * Trainer: list all check-ins from their clients, optional client_id filter.
     */
    public function trainerIndex(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'trainer') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $query = CheckIn::with('client')
            ->where('trainer_id', $user->id)
            ->orderBy('week_start', 'desc');

        if ($request->has('client_id') && $request->client_id) {
            $query->where('client_id', $request->client_id);
        }

        $checkIns = $query->get();

        return response()->json(['check_ins' => $checkIns], 200);
    }

    /**
     * Trainer: view one check-in with client relation, weight_change, and previous check-in.
     */
    public function trainerShow($id)
    {
        $user = Auth::user();

        if ($user->role !== 'trainer') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $checkIn = CheckIn::with('client')
            ->where('id', $id)
            ->where('trainer_id', $user->id)
            ->first();

        if (!$checkIn) {
            return response()->json(['message' => 'Check-in not found.'], 404);
        }

        $weightChange = null;
        $previous = null;

        $previousCheckIn = CheckIn::where('client_id', $checkIn->client_id)
            ->where('week_start', '<', $checkIn->week_start)
            ->orderBy('week_start', 'desc')
            ->first();

        if ($previousCheckIn) {
            $previous = $previousCheckIn;

            if ($checkIn->weight !== null && $previousCheckIn->weight !== null) {
                $weightChange = round((float) $checkIn->weight - (float) $previousCheckIn->weight, 2);
            }
        }

        return response()->json([
            'check_in'     => $checkIn,
            'previous'     => $previous,
            'weight_change' => $weightChange,
        ], 200);
    }

    /**
     * Trainer: submit feedback for a check-in.
     */
    public function review(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'trainer') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $checkIn = CheckIn::where('id', $id)
            ->where('trainer_id', $user->id)
            ->first();

        if (!$checkIn) {
            return response()->json(['message' => 'Check-in not found.'], 404);
        }

        $validated = $request->validate([
            'trainer_feedback'    => 'nullable|string|max:3000',
            'trainer_adjustments' => 'nullable|string|max:3000',
        ]);

        $checkIn->update([
            'trainer_feedback'    => $validated['trainer_feedback'] ?? null,
            'trainer_adjustments' => $validated['trainer_adjustments'] ?? null,
            'reviewed_at'         => Carbon::now(),
        ]);

        // Notify the client
        Notification::create([
            'user_id' => $checkIn->client_id,
            'type'    => 'check_in_reviewed',
            'data'    => [
                'check_in_id'  => $checkIn->id,
                'trainer_id'   => $user->id,
                'trainer_name' => $user->name,
                'week_start'   => $checkIn->week_start->toDateString(),
                'message'      => "{$user->name} reviewed your check-in.",
            ],
        ]);

        return response()->json(['check_in' => $checkIn->fresh()], 200);
    }
}
