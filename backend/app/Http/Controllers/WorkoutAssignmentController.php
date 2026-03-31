<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\WorkoutAssignment;
use App\Models\WorkoutAssignmentComment;
use App\Models\WorkoutAssignmentCommentReaction;
use App\Models\WorkoutAssignmentReaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkoutAssignmentController extends Controller
{
    // ── Shared: resolve + authorize ───────────────────────────────────────────

    private function resolveAssignment(int $id): ?WorkoutAssignment
    {
        $user = Auth::user();
        return WorkoutAssignment::with(['workout.workoutExercises.exercise', 'client', 'trainer'])
            ->where('id', $id)
            ->where(function ($q) use ($user) {
                $q->where('client_id', $user->id)
                  ->orWhere('trainer_id', $user->id);
            })
            ->first();
    }

    private function formatAssignment(WorkoutAssignment $a, int $userId): array
    {
        return [
            'id'             => $a->id,
            'scheduled_date' => $a->scheduled_date?->format('Y-m-d'),
            'completed_at'   => $a->completed_at,
            'workout'        => $a->workout,
            'client'         => $a->client ? ['id' => $a->client->id, 'name' => $a->client->name] : null,
            'trainer'        => $a->trainer ? ['id' => $a->trainer->id, 'name' => $a->trainer->name] : null,
            'like_count'     => $a->reactions()->count(),
            'liked_by_me'    => $a->reactions()->where('user_id', $userId)->exists(),
            'comment_count'  => $a->comments()->count(),
        ];
    }

    // Determine the other party's user ID for notifications
    private function otherPartyId(WorkoutAssignment $assignment, int $userId): int
    {
        return $userId === $assignment->client_id
            ? $assignment->trainer_id
            : $assignment->client_id;
    }

    // ── GET assignment detail (client or trainer) ─────────────────────────────

    public function show(int $id)
    {
        $user = Auth::user();
        $assignment = $this->resolveAssignment($id);

        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        return response()->json(['assignment' => $this->formatAssignment($assignment, $user->id)]);
    }

    // ── PATCH complete (client only) ──────────────────────────────────────────

    public function complete(int $id)
    {
        $user = Auth::user();

        $assignment = WorkoutAssignment::with('workout')
            ->where('id', $id)
            ->where('client_id', $user->id)
            ->first();

        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $wasCompleted = (bool) $assignment->completed_at;

        if ($wasCompleted) {
            $assignment->update(['completed_at' => null]);
        } else {
            $assignment->update(['completed_at' => Carbon::now()]);

            // Notify trainer
            Notification::create([
                'user_id' => $assignment->trainer_id,
                'type'    => 'workout_completed',
                'data'    => [
                    'message'       => "{$user->name} completed \"{$assignment->workout->title}\".",
                    'assignment_id' => $assignment->id,
                    'client_name'   => $user->name,
                    'sender_id'     => $user->id,
                ],
            ]);
        }

        return response()->json([
            'completed_at' => $assignment->fresh()->completed_at,
        ]);
    }

    // ── POST like toggle (client or trainer) ──────────────────────────────────

    public function toggleLike(int $id)
    {
        $user = Auth::user();
        $assignment = $this->resolveAssignment($id);

        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $existing = WorkoutAssignmentReaction::where('assignment_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            WorkoutAssignmentReaction::create([
                'assignment_id' => $id,
                'user_id'       => $user->id,
            ]);
            $liked = true;

            // Notify the other party
            $recipientId  = $this->otherPartyId($assignment, $user->id);
            $senderField  = $user->role === 'client' ? 'client_name' : 'trainer_name';
            Notification::create([
                'user_id' => $recipientId,
                'type'    => 'workout_liked',
                'data'    => [
                    'message'       => "{$user->name} liked your workout \"{$assignment->workout->title}\".",
                    'assignment_id' => $assignment->id,
                    $senderField    => $user->name,
                    'sender_id'     => $user->id,
                ],
            ]);
        }

        return response()->json([
            'liked'      => $liked,
            'like_count' => WorkoutAssignmentReaction::where('assignment_id', $id)->count(),
        ]);
    }

    // ── GET comments (client or trainer) ─────────────────────────────────────

    public function comments(int $id)
    {
        $user       = Auth::user();
        $assignment = $this->resolveAssignment($id);

        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $comments = WorkoutAssignmentComment::with('user:id,name')
            ->withCount('reactions as like_count')
            ->where('assignment_id', $id)
            ->orderBy('created_at', 'asc')
            ->get();

        $commentIds    = $comments->pluck('id');
        $likedCommentIds = WorkoutAssignmentCommentReaction::whereIn('comment_id', $commentIds)
            ->where('user_id', $user->id)
            ->pluck('comment_id');

        $formatted = $comments->map(fn ($c) => [
            'id'          => $c->id,
            'body'        => $c->body,
            'user_id'     => $c->user_id,
            'user_name'   => $c->user->name ?? 'Unknown',
            'created_at'  => $c->created_at,
            'like_count'  => (int) $c->like_count,
            'liked_by_me' => $likedCommentIds->contains($c->id),
        ]);

        return response()->json(['comments' => $formatted]);
    }

    // ── POST add comment (client or trainer) ─────────────────────────────────

    public function addComment(Request $request, int $id)
    {
        $user = Auth::user();
        $assignment = $this->resolveAssignment($id);

        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $validated = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $comment = WorkoutAssignmentComment::create([
            'assignment_id' => $id,
            'user_id'       => $user->id,
            'body'          => $validated['body'],
        ]);

        // Notify the other party
        $recipientId  = $this->otherPartyId($assignment, $user->id);
        $preview      = mb_substr($validated['body'], 0, 80);
        $ellipsis     = mb_strlen($validated['body']) > 80 ? '...' : '';
        $senderField  = $user->role === 'client' ? 'client_name' : 'trainer_name';

        Notification::create([
            'user_id' => $recipientId,
            'type'    => 'workout_commented',
            'data'    => [
                'message'       => "{$user->name}: \"{$preview}{$ellipsis}\"",
                'assignment_id' => $assignment->id,
                'workout_title' => $assignment->workout->title,
                $senderField    => $user->name,
                'sender_id'     => $user->id,
            ],
        ]);

        return response()->json([
            'comment' => [
                'id'         => $comment->id,
                'body'       => $comment->body,
                'user_id'    => $user->id,
                'user_name'  => $user->name,
                'created_at' => $comment->created_at,
            ],
        ], 201);
    }

    // ── DELETE comment (author only) ──────────────────────────────────────────

    public function deleteComment(int $assignmentId, int $commentId)
    {
        $user       = Auth::user();
        $assignment = $this->resolveAssignment($assignmentId);

        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $comment = WorkoutAssignmentComment::where('id', $commentId)
            ->where('assignment_id', $assignmentId)
            ->first();

        if (!$comment) {
            return response()->json(['message' => 'Comment not found.'], 404);
        }

        if ($comment->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    // ── POST toggle comment like ───────────────────────────────────────────────

    public function toggleCommentLike(int $assignmentId, int $commentId)
    {
        $user       = Auth::user();
        $assignment = $this->resolveAssignment($assignmentId);

        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $comment = WorkoutAssignmentComment::where('id', $commentId)
            ->where('assignment_id', $assignmentId)
            ->first();

        if (!$comment) {
            return response()->json(['message' => 'Comment not found.'], 404);
        }

        $existing = WorkoutAssignmentCommentReaction::where('comment_id', $commentId)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            WorkoutAssignmentCommentReaction::create([
                'comment_id' => $commentId,
                'user_id'    => $user->id,
            ]);
            $liked = true;

            // Notify comment author — skip if user is liking their own comment
            if ($comment->user_id !== $user->id) {
                $comment->loadMissing('user:id,name');
                $senderField = $user->role === 'client' ? 'client_name' : 'trainer_name';
                Notification::create([
                    'user_id' => $comment->user_id,
                    'type'    => 'comment_liked',
                    'data'    => [
                        'message'       => "{$user->name} liked your comment on \"{$assignment->workout->title}\".",
                        'assignment_id' => $assignmentId,
                        'workout_title' => $assignment->workout->title,
                        $senderField    => $user->name,
                        'sender_id'     => $user->id,
                    ],
                ]);
            }
        }

        return response()->json([
            'liked'      => $liked,
            'like_count' => WorkoutAssignmentCommentReaction::where('comment_id', $commentId)->count(),
        ]);
    }

    // ── GET trainer: a specific client's full schedule ────────────────────────

    public function trainerClientSchedule(int $clientId)
    {
        $trainer = Auth::user();

        if ($trainer->role !== 'trainer') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $assignments = WorkoutAssignment::with('workout')
            ->where('trainer_id', $trainer->id)
            ->where('client_id', $clientId)
            ->orderByRaw('scheduled_date IS NULL ASC')
            ->orderBy('scheduled_date', 'asc')
            ->get()
            ->map(fn ($a) => [
                'id'             => $a->id,
                'scheduled_date' => $a->scheduled_date?->format('Y-m-d'),
                'completed_at'   => $a->completed_at,
                'workout'        => $a->workout,
                'like_count'     => $a->reactions()->count(),
                'liked_by_me'    => $a->reactions()->where('user_id', $trainer->id)->exists(),
                'comment_count'  => $a->comments()->count(),
            ]);

        return response()->json(['schedule' => $assignments]);
    }
}
