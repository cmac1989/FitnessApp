<?php

namespace App\Http\Controllers;

use App\Models\ClientGoal;
use App\Models\ClientMetric;
use App\Models\ClientProfile;
use App\Models\ProgressLog;
use App\Models\TrainingSession;
use App\Models\Workout;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class TrainerDashboardController extends Controller
{
    public function getDashboard()
    {
        $trainer   = Auth::user();
        $trainerId = $trainer->id;

        // ── All clients ───────────────────────────────────────────────────────
        $clients   = ClientProfile::with('user')->where('trainer_id', $trainerId)->get();
        $clientIds = $clients->pluck('user_id');

        // ── Overview ──────────────────────────────────────────────────────────
        $totalClients = $clients->count();

        $sessionsTodayCount = TrainingSession::where('trainer_id', $trainerId)
            ->whereDate('scheduled_at', today())
            ->count();

        $sessionsThisWeek = TrainingSession::where('trainer_id', $trainerId)
            ->whereBetween('scheduled_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();

        $totalPlans = Workout::where('user_id', $trainerId)->count();

        // ── Client Progress (batch — no N+1) ──────────────────────────────────
        $activeGoals = ClientGoal::whereIn('client_id', $clientIds)
            ->where('status', 'active')
            ->get()
            ->keyBy('client_id');

        // Latest weight per client
        $latestWeights = ClientMetric::whereIn('client_id', $clientIds)
            ->where('type', 'weight')
            ->orderBy('recorded_at', 'desc')
            ->get()
            ->unique('client_id')
            ->keyBy('client_id');

        // Weight 7 days ago per client
        $weekAgoWeights = ClientMetric::whereIn('client_id', $clientIds)
            ->where('type', 'weight')
            ->where('recorded_at', '<=', now()->subDays(7))
            ->orderBy('recorded_at', 'desc')
            ->get()
            ->unique('client_id')
            ->keyBy('client_id');

        // Completed workout counts per client
        $completedCounts = ProgressLog::whereIn('client_id', $clientIds)
            ->whereNotNull('completed_at')
            ->selectRaw('client_id, count(*) as total')
            ->groupBy('client_id')
            ->pluck('total', 'client_id');

        // Last activity date per client
        $lastActiveDates = ProgressLog::whereIn('client_id', $clientIds)
            ->whereNotNull('completed_at')
            ->selectRaw('client_id, MAX(completed_at) as last_at')
            ->groupBy('client_id')
            ->pluck('last_at', 'client_id');

        $clientProgress = $clients->map(function ($cp) use (
            $activeGoals, $latestWeights, $weekAgoWeights, $completedCounts, $lastActiveDates
        ) {
            $id           = $cp->user_id;
            $goal         = $activeGoals->get($id);
            $latestWeight = $latestWeights->get($id);
            $weekAgoWeight = $weekAgoWeights->get($id);

            $weightChange7d = null;
            if ($latestWeight && $weekAgoWeight) {
                $weightChange7d = round((float) $latestWeight->value - (float) $weekAgoWeight->value, 1);
            }

            $lastAt = $lastActiveDates->get($id);
            $daysSinceActive = $lastAt
                ? (int) now()->diffInDays(Carbon::parse($lastAt), true)
                : null;

            return [
                'id'               => $id,
                'name'             => $cp->user->name,
                'goal_type'        => $goal?->type,
                'goal_progress'    => $goal?->progress_percent,
                'weight_change_7d' => $weightChange7d,
                'weight_unit'      => $latestWeight?->unit ?? 'lbs',
                'workouts_completed' => (int) $completedCounts->get($id, 0),
                'days_since_active'  => $daysSinceActive,
            ];
        })->values()->toArray();

        // ── Compliance ────────────────────────────────────────────────────────
        $weekSessions = TrainingSession::where('trainer_id', $trainerId)
            ->whereBetween('scheduled_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $completedThisWeek = (int) $weekSessions->get('completed', 0);
        $scheduledThisWeek = (int) $weekSessions->sum();
        $sessionCompletionRate = $scheduledThisWeek > 0
            ? (int) round(($completedThisWeek / $scheduledThisWeek) * 100)
            : 0;

        // Inactive = no completed progress log in 14+ days
        $inactiveAlerts = collect($clientProgress)
            ->filter(fn ($c) => $c['days_since_active'] === null || $c['days_since_active'] >= 14)
            ->map(fn ($c) => [
                'id'           => $c['id'],
                'name'         => $c['name'],
                'days_inactive' => $c['days_since_active'],
            ])
            ->values()
            ->toArray();

        // ── Business Metrics ──────────────────────────────────────────────────
        $thisMonthStart  = now()->startOfMonth();
        $lastMonthStart  = now()->subMonth()->startOfMonth();
        $lastMonthEnd    = now()->subMonth()->endOfMonth();
        $thirtyDaysAgo   = now()->subDays(30);

        $activeClientIds = TrainingSession::where('trainer_id', $trainerId)
            ->where('scheduled_at', '>=', $thirtyDaysAgo)
            ->pluck('client_id')
            ->unique();

        $activeClientsCount   = $activeClientIds->count();
        $inactiveClientsCount = max(0, $totalClients - $activeClientsCount);

        $sessionsThisMonth = TrainingSession::where('trainer_id', $trainerId)
            ->where('scheduled_at', '>=', $thisMonthStart)
            ->count();

        $sessionsLastMonth = TrainingSession::where('trainer_id', $trainerId)
            ->whereBetween('scheduled_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        $sessionGrowthPct = $sessionsLastMonth > 0
            ? (int) round((($sessionsThisMonth - $sessionsLastMonth) / $sessionsLastMonth) * 100)
            : null;

        // Retention: clients who had sessions last month who also have them this month
        $lastMonthClientIds = TrainingSession::where('trainer_id', $trainerId)
            ->whereBetween('scheduled_at', [$lastMonthStart, $lastMonthEnd])
            ->pluck('client_id')->unique();

        $thisMonthClientIds = TrainingSession::where('trainer_id', $trainerId)
            ->where('scheduled_at', '>=', $thisMonthStart)
            ->pluck('client_id')->unique();

        $retainedCount  = $lastMonthClientIds->intersect($thisMonthClientIds)->count();
        $retentionRate  = $lastMonthClientIds->count() > 0
            ? (int) round(($retainedCount / $lastMonthClientIds->count()) * 100)
            : null;

        return response()->json([
            'trainer_name'    => $trainer->name,
            'overview'        => [
                'total_clients'       => $totalClients,
                'active_clients'      => $activeClientsCount,
                'sessions_today'      => $sessionsTodayCount,
                'sessions_this_week'  => $sessionsThisWeek,
                'total_plans'         => $totalPlans,
            ],
            'client_progress' => $clientProgress,
            'compliance'      => [
                'session_completion_rate'      => $sessionCompletionRate,
                'sessions_completed_this_week' => $completedThisWeek,
                'sessions_scheduled_this_week' => $scheduledThisWeek,
                'inactive_alerts'              => $inactiveAlerts,
            ],
            'business'        => [
                'active_clients'       => $activeClientsCount,
                'inactive_clients'     => $inactiveClientsCount,
                'retention_rate'       => $retentionRate,
                'sessions_this_month'  => $sessionsThisMonth,
                'sessions_last_month'  => $sessionsLastMonth,
                'session_growth_pct'   => $sessionGrowthPct,
            ],
        ]);
    }

    // Legacy alias
    public function getStats()
    {
        return $this->getDashboard();
    }
}
