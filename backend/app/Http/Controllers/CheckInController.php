<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Models\ClientProfile;
use App\Models\Notification;
use App\Models\WorkoutAssignment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckInController extends Controller
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    private function statusFor(CheckIn $c): string
    {
        if ($c->submitted_at === null) return 'pending';
        if ($c->reviewed_at  !== null) return 'reviewed';
        return 'completed';
    }

    // ── Client endpoints ──────────────────────────────────────────────────────

    /**
     * Client: list their check-ins (pending + completed + reviewed).
     */
    public function clientIndex()
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $checkIns = CheckIn::where('client_id', $user->id)
            ->orderBy('week_start', 'desc')
            ->get()
            ->map(fn($c) => array_merge($c->toArray(), ['status' => $this->statusFor($c)]));

        return response()->json(['check_ins' => $checkIns], 200);
    }

    /**
     * Client: complete an assigned (pending) check-in.
     * Adherence is auto-calculated from workout completions that week.
     */
    public function clientComplete(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $checkIn = CheckIn::where('id', $id)->where('client_id', $user->id)->first();

        if (!$checkIn) {
            return response()->json(['message' => 'Check-in not found.'], 404);
        }

        if ($checkIn->submitted_at !== null) {
            return response()->json(['message' => 'This check-in has already been submitted.'], 422);
        }

        $validated = $request->validate([
            'weight'       => 'nullable|numeric|min:0',
            'weight_unit'  => 'nullable|string|in:lbs,kg',
            'energy_score' => 'nullable|integer|min:1|max:10',
            'client_notes' => 'nullable|string|max:2000',
        ]);

        // Auto-calculate adherence from workout completions for this week
        $weekStart = $checkIn->week_start->toDateString();
        $weekEnd   = Carbon::parse($weekStart)->addDays(6)->toDateString();

        $totalWorkouts = WorkoutAssignment::where('client_id', $user->id)
            ->whereNotNull('scheduled_date')
            ->whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->count();

        $completedWorkouts = WorkoutAssignment::where('client_id', $user->id)
            ->whereNotNull('scheduled_date')
            ->whereBetween('scheduled_date', [$weekStart, $weekEnd])
            ->whereNotNull('completed_at')
            ->count();

        $adherenceScore = $totalWorkouts > 0
            ? (int) round(($completedWorkouts / $totalWorkouts) * 10)
            : null;

        $checkIn->update([
            'weight'          => $validated['weight'] ?? null,
            'weight_unit'     => $validated['weight_unit'] ?? 'lbs',
            'adherence_score' => $adherenceScore,
            'energy_score'    => $validated['energy_score'] ?? null,
            'client_notes'    => $validated['client_notes'] ?? null,
            'submitted_at'    => Carbon::now(),
        ]);

        // Notify trainer
        Notification::create([
            'user_id' => $checkIn->trainer_id,
            'type'    => 'check_in_submitted',
            'data'    => [
                'check_in_id' => $checkIn->id,
                'client_id'   => $user->id,
                'client_name' => $user->name,
                'week_start'  => $weekStart,
                'message'     => "{$user->name} submitted their weekly check-in.",
            ],
        ]);

        return response()->json([
            'check_in' => array_merge(
                $checkIn->fresh()->toArray(),
                ['status' => 'completed']
            ),
        ], 200);
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

        $checkIn = CheckIn::where('id', $id)->where('client_id', $user->id)->first();

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

            if ($previous?->weight !== null) {
                $weightChange = round((float) $checkIn->weight - (float) $previous->weight, 2);
            }
        }

        return response()->json([
            'check_in'      => array_merge($checkIn->toArray(), ['status' => $this->statusFor($checkIn)]),
            'weight_change' => $weightChange,
        ], 200);
    }

    // ── Trainer endpoints ─────────────────────────────────────────────────────

    /**
     * Trainer: assign a check-in to a client for the current week.
     * The check-in is created as "pending" — client fills it in later.
     */
    public function trainerStore(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'trainer') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'client_id' => 'required|integer|exists:users,id',
        ]);

        $clientProfile = ClientProfile::where('user_id', $validated['client_id'])
            ->where('trainer_id', $user->id)
            ->first();

        if (!$clientProfile) {
            return response()->json(['message' => 'Client not found or not linked to you.'], 404);
        }

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();

        $existing = CheckIn::where('client_id', $validated['client_id'])
            ->where('week_start', $weekStart)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'A check-in already exists for this client this week.'], 422);
        }

        $checkIn = CheckIn::create([
            'client_id'    => $validated['client_id'],
            'trainer_id'   => $user->id,
            'week_start'   => $weekStart,
            'submitted_at' => null,
        ]);

        // Notify the client
        Notification::create([
            'user_id' => $validated['client_id'],
            'type'    => 'check_in_assigned',
            'data'    => [
                'check_in_id'  => $checkIn->id,
                'trainer_id'   => $user->id,
                'trainer_name' => $user->name,
                'week_start'   => $weekStart,
                'message'      => "{$user->name} assigned you a weekly check-in.",
            ],
        ]);

        return response()->json([
            'check_in' => array_merge($checkIn->toArray(), ['status' => 'pending']),
        ], 201);
    }

    /**
     * Trainer: batch-assign a check-in to multiple clients for the current week.
     */
    public function batchStore(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'trainer') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'client_ids'   => 'required|array|min:1',
            'client_ids.*' => 'integer|exists:users,id',
        ]);

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();
        $created   = 0;
        $skipped   = 0;

        foreach ($validated['client_ids'] as $clientId) {
            $clientProfile = ClientProfile::where('user_id', $clientId)
                ->where('trainer_id', $user->id)
                ->first();

            if (!$clientProfile) {
                $skipped++;
                continue;
            }

            $existing = CheckIn::where('client_id', $clientId)
                ->where('week_start', $weekStart)
                ->first();

            if ($existing) {
                $skipped++;
                continue;
            }

            $checkIn = CheckIn::create([
                'client_id'    => $clientId,
                'trainer_id'   => $user->id,
                'week_start'   => $weekStart,
                'submitted_at' => null,
            ]);

            Notification::create([
                'user_id' => $clientId,
                'type'    => 'check_in_assigned',
                'data'    => [
                    'check_in_id'  => $checkIn->id,
                    'trainer_id'   => $user->id,
                    'trainer_name' => $user->name,
                    'week_start'   => $weekStart,
                    'message'      => "{$user->name} assigned you a weekly check-in.",
                ],
            ]);

            $created++;
        }

        return response()->json([
            'message' => "Assigned to {$created} client(s)." . ($skipped > 0 ? " {$skipped} skipped (already assigned or not linked)." : ''),
            'created' => $created,
            'skipped' => $skipped,
        ], 201);
    }

    /**
     * Trainer: list all check-ins from their clients.
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

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $checkIns = $query->get()->map(fn($c) => array_merge($c->toArray(), ['status' => $this->statusFor($c)]));

        return response()->json(['check_ins' => $checkIns], 200);
    }

    /**
     * Trainer: view one check-in with weight_change and previous check-in.
     */
    public function trainerShow($id)
    {
        $user = Auth::user();

        if ($user->role !== 'trainer') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $checkIn = CheckIn::with('client')->where('id', $id)->where('trainer_id', $user->id)->first();

        if (!$checkIn) {
            return response()->json(['message' => 'Check-in not found.'], 404);
        }

        $weightChange = null;
        $previous     = null;

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
            'check_in'      => array_merge($checkIn->toArray(), ['status' => $this->statusFor($checkIn)]),
            'previous'      => $previous,
            'weight_change' => $weightChange,
        ], 200);
    }

    /**
     * Trainer: submit feedback for a completed check-in.
     */
    public function review(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'trainer') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $checkIn = CheckIn::where('id', $id)->where('trainer_id', $user->id)->first();

        if (!$checkIn) {
            return response()->json(['message' => 'Check-in not found.'], 404);
        }

        if ($checkIn->submitted_at === null) {
            return response()->json(['message' => 'Cannot review a check-in that has not been submitted yet.'], 422);
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

        $fresh = $checkIn->fresh();
        return response()->json([
            'check_in' => array_merge($fresh->toArray(), ['status' => $this->statusFor($fresh)]),
        ], 200);
    }
}
