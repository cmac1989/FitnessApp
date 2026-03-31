<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $authUser      = auth()->user();
        $notifications = $authUser->notifications()->latest()->get();

        // ── Step 1: ID-based photo lookup ─────────────────────────────────────
        // sender_id  = canonical field added to all new notifications.
        // client_id / trainer_id = legacy fields present in older records.
        $senderIds = collect();
        foreach ($notifications as $n) {
            $d  = is_array($n->data) ? $n->data : [];
            $id = $d['sender_id'] ?? $d['client_id'] ?? $d['trainer_id'] ?? null;
            if ($id) $senderIds->push((int) $id);
        }

        $photosById = User::whereIn('id', $senderIds->unique())
            ->pluck('profile_picture', 'id');

        // ── Step 2: Name-based fallback for legacy notifications ──────────────
        // Old notifications (e.g. workout_liked, workout_completed, comment_liked,
        // workout_commented, message_liked) only stored client_name / trainer_name
        // with no user ID. We resolve them by name, scoped to users actually
        // linked to the authenticated user so the match is reliable.
        $photosByName = collect();

        $hasUnresolved = $notifications->contains(function ($n) {
            $d = is_array($n->data) ? $n->data : [];
            return ($d['sender_id'] ?? $d['client_id'] ?? $d['trainer_id'] ?? null) === null;
        });

        if ($hasUnresolved) {
            if ($authUser->role === 'trainer') {
                // Sender of trainer-side notifications is always one of their clients.
                $photosByName = User::whereHas('clientProfile', fn ($q) =>
                    $q->where('trainer_id', $authUser->id)
                )->pluck('profile_picture', 'name');
            } else {
                // Sender of client-side notifications is always their trainer.
                $profile = ClientProfile::where('user_id', $authUser->id)->first();
                if ($profile?->trainer_id) {
                    $trainer = User::find($profile->trainer_id);
                    if ($trainer) {
                        $photosByName->put($trainer->name, $trainer->profile_picture);
                    }
                }
            }
        }

        // ── Step 3: Enrich each notification with sender_photo ────────────────
        $enriched = $notifications->map(function ($n) use ($photosById, $photosByName) {
            $arr      = $n->toArray();
            $data     = is_array($arr['data']) ? $arr['data'] : [];
            $senderId = $data['sender_id'] ?? $data['client_id'] ?? $data['trainer_id'] ?? null;

            if ($senderId !== null) {
                // ID-based resolution (always preferred)
                $data['sender_photo'] = $photosById->get((int) $senderId);
            } else {
                // Name-based fallback for legacy records
                $senderName = $data['client_name'] ?? $data['trainer_name'] ?? null;
                $data['sender_photo'] = ($senderName && $photosByName->has($senderName))
                    ? $photosByName->get($senderName)
                    : null;
            }

            $arr['data'] = $data;
            return $arr;
        });

        return response()->json($enriched);
    }

    public function show($id)
    {
        $notification = auth()->user()->notifications()->findOrFail($id);
        return response()->json($notification);
    }

    public function markAsRead($id)
    {
        $notification = auth()->user()->notifications()->findOrFail($id);
        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllAsRead()
    {
        auth()->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function unreadCount()
    {
        $count = auth()->user()->notifications()->whereNull('read_at')->count();
        return response()->json(['unread_count' => $count]);
    }

    public function destroy($id)
    {
        $notification = auth()->user()->notifications()->findOrFail($id);
        $notification->delete();
        return response()->json(['message' => 'Notification deleted.']);
    }
}
