<?php

namespace App\Http\Controllers;

use App\Models\ClientGoal;
use App\Models\ClientMetric;
use App\Models\ClientProfile;
use App\Models\TrainingSession;
use App\Models\WorkoutAssignment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientDashboardController extends Controller
{
    // ── Dashboard ─────────────────────────────────────────────────────────────

    public function getDashboard()
    {
        $client   = Auth::user();
        $clientId = $client->id;

        // Sessions
        $sessionsTodayCount = TrainingSession::where('client_id', $clientId)
            ->whereDate('scheduled_at', today())
            ->count();

        $sessionsUpcomingCount = TrainingSession::where('client_id', $clientId)
            ->where('scheduled_at', '>', now())
            ->count();

        // Trainer info
        $clientProfile = ClientProfile::with('trainer')
            ->where('user_id', $clientId)
            ->first();

        $trainerName = $clientProfile?->trainer?->name ?? null;
        $trainerId   = $clientProfile?->trainer_id ?? null;

        // ── Goal ──────────────────────────────────────────────────────────────
        $goal     = ClientGoal::where('client_id', $clientId)->where('status', 'active')->latest()->first();
        $goalData = null;

        if ($goal) {
            $daysRemaining = null;
            if ($goal->deadline) {
                $daysRemaining = (int) max(0, now()->startOfDay()->diffInDays(
                    Carbon::parse($goal->deadline)->startOfDay(),
                    false
                ));
            }

            $goalData = [
                'id'              => $goal->id,
                'type'            => $goal->type,
                'description'     => $goal->description,
                'start_value'     => (float) $goal->start_value,
                'current_value'   => (float) $goal->current_value,
                'target_value'    => (float) $goal->target_value,
                'unit'            => $goal->unit,
                'deadline'        => $goal->deadline?->toDateString(),
                'progress_percent'=> $goal->progress_percent,
                'days_remaining'  => $daysRemaining,
            ];
        }

        // ── Metrics ───────────────────────────────────────────────────────────
        $latestWeight = ClientMetric::where('client_id', $clientId)
            ->where('type', 'weight')
            ->latest('recorded_at')
            ->first();

        $weightTrend = ClientMetric::where('client_id', $clientId)
            ->where('type', 'weight')
            ->orderBy('recorded_at', 'desc')
            ->limit(8)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($m) => [
                'date'  => Carbon::parse($m->recorded_at)->toDateString(),
                'value' => (float) $m->value,
            ]);

        $weekAgoWeight = ClientMetric::where('client_id', $clientId)
            ->where('type', 'weight')
            ->where('recorded_at', '<=', now()->subDays(7))
            ->latest('recorded_at')
            ->first();

        $weightChange7d = null;
        if ($latestWeight && $weekAgoWeight) {
            $weightChange7d = round((float) $latestWeight->value - (float) $weekAgoWeight->value, 1);
        }

        $latestWaist   = ClientMetric::where('client_id', $clientId)->where('type', 'waist')->latest('recorded_at')->value('value');
        $latestBodyFat = ClientMetric::where('client_id', $clientId)->where('type', 'body_fat')->latest('recorded_at')->value('value');

        // ── Workout Analytics ─────────────────────────────────────────────────
        $workoutsAssigned = WorkoutAssignment::where('client_id', $clientId)->count();

        $workoutsCompleted = WorkoutAssignment::where('client_id', $clientId)
            ->whereNotNull('completed_at')
            ->count();

        $completionRate = $workoutsAssigned > 0
            ? (int) round(($workoutsCompleted / $workoutsAssigned) * 100)
            : 0;

        $thisWeekCompleted = WorkoutAssignment::where('client_id', $clientId)
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();

        // Current streak — consecutive days ending today or yesterday with a completed workout
        $completedDates = WorkoutAssignment::where('client_id', $clientId)
            ->whereNotNull('completed_at')
            ->selectRaw('DATE(completed_at) as day')
            ->groupBy('day')
            ->orderByRaw('day DESC')
            ->pluck('day')
            ->map(fn ($d) => Carbon::parse($d)->startOfDay());

        $currentStreak = 0;
        if ($completedDates->isNotEmpty()) {
            $today     = now()->startOfDay();
            $yesterday = now()->subDay()->startOfDay();
            $mostRecent = $completedDates->first();

            if ($mostRecent->eq($today) || $mostRecent->eq($yesterday)) {
                $currentStreak = 1;
                $expected = $mostRecent->copy()->subDay();
                foreach ($completedDates->skip(1) as $date) {
                    if ($date->eq($expected)) {
                        $currentStreak++;
                        $expected->subDay();
                    } else {
                        break;
                    }
                }
            }
        }

        return response()->json([
            'client_name'       => $client->name,
            'trainer_name'      => $trainerName,
            'trainer_id'        => $trainerId,
            'sessions_today'    => $sessionsTodayCount,
            'sessions_upcoming' => $sessionsUpcomingCount,
            'goal'              => $goalData,
            'metrics'           => [
                'latest_weight'   => $latestWeight ? (float) $latestWeight->value : null,
                'weight_unit'     => $latestWeight->unit ?? 'lbs',
                'weight_change_7d'=> $weightChange7d,
                'weight_trend'    => $weightTrend,
                'latest_waist'    => $latestWaist ? (float) $latestWaist : null,
                'latest_body_fat' => $latestBodyFat ? (float) $latestBodyFat : null,
            ],
            'workout_analytics' => [
                'workouts_assigned'  => $workoutsAssigned,
                'workouts_completed' => $workoutsCompleted,
                'completion_rate'    => $completionRate,
                'current_streak'     => $currentStreak,
                'this_week_completed'=> $thisWeekCompleted,
            ],
        ]);
    }

    // Keep /stats alias for backward compatibility
    public function getStats()
    {
        return $this->getDashboard();
    }

    // ── Goals ─────────────────────────────────────────────────────────────────

    public function getGoal()
    {
        $goal = ClientGoal::where('client_id', Auth::id())->where('status', 'active')->latest()->first();
        return response()->json($goal);
    }

    public function setGoal(Request $request)
    {
        $validated = $request->validate([
            'type'          => 'required|string|max:50',
            'description'   => 'nullable|string|max:255',
            'start_value'   => 'nullable|numeric',
            'current_value' => 'nullable|numeric',
            'target_value'  => 'nullable|numeric',
            'unit'          => 'nullable|string|max:20',
            'deadline'      => 'nullable|date',
        ]);

        // Pause existing active goals
        ClientGoal::where('client_id', Auth::id())->where('status', 'active')->update(['status' => 'paused']);

        $goal = ClientGoal::create(array_merge($validated, ['client_id' => Auth::id(), 'status' => 'active']));

        return response()->json($goal, 201);
    }

    public function updateGoal(Request $request, $id)
    {
        $goal = ClientGoal::where('id', $id)->where('client_id', Auth::id())->firstOrFail();

        $validated = $request->validate([
            'type'          => 'sometimes|string|max:50',
            'description'   => 'nullable|string|max:255',
            'start_value'   => 'nullable|numeric',
            'current_value' => 'nullable|numeric',
            'target_value'  => 'nullable|numeric',
            'unit'          => 'nullable|string|max:20',
            'deadline'      => 'nullable|date',
            'status'        => 'sometimes|in:active,completed,paused',
        ]);

        $goal->update($validated);

        return response()->json($goal);
    }

    // ── Metrics ───────────────────────────────────────────────────────────────

    public function logMetric(Request $request)
    {
        $validated = $request->validate([
            'type'        => 'required|string|max:50',
            'value'       => 'required|numeric',
            'unit'        => 'nullable|string|max:20',
            'notes'       => 'nullable|string|max:500',
            'recorded_at' => 'nullable|date',
        ]);

        $metric = ClientMetric::create(array_merge($validated, [
            'client_id'   => Auth::id(),
            'recorded_at' => $validated['recorded_at'] ?? now(),
        ]));

        // Keep goal current_value in sync when logging weight
        if ($validated['type'] === 'weight') {
            $goal = ClientGoal::where('client_id', Auth::id())->where('status', 'active')->latest()->first();
            if ($goal && $goal->type === 'weight_loss') {
                $goal->update(['current_value' => $validated['value']]);
            }
        }

        return response()->json($metric, 201);
    }

    public function getMetrics(Request $request, string $type)
    {
        $limit = min((int) $request->query('limit', 30), 90);

        $metrics = ClientMetric::where('client_id', Auth::id())
            ->where('type', $type)
            ->orderBy('recorded_at', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        return response()->json($metrics);
    }
}
