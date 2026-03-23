<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    // Get all messages for the authenticated user
    public function index()
    {
        $messages = Message::where('sender_id', Auth::id())
            ->orWhere('receiver_id', Auth::id())
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    // Latest message per conversation, with read_at
    public function getLatestMessagesPerConversation()
    {
        $authId = Auth::id();

        $messages = Message::with(['sender', 'receiver'])
            ->where(function ($q) use ($authId) {
                $q->where('sender_id', $authId)->orWhere('receiver_id', $authId);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $conversations = [];

        foreach ($messages as $message) {
            $otherUser = $message->sender_id === $authId
                ? $message->receiver
                : $message->sender;

            if (!isset($conversations[$otherUser->id])) {
                $conversations[$otherUser->id] = [
                    'user' => [
                        'id'   => $otherUser->id,
                        'name' => $otherUser->name,
                    ],
                    'last_message' => [
                        'content'    => $message->deleted_at ? null : $message->content,
                        'is_deleted' => !is_null($message->deleted_at),
                        'created_at' => $message->created_at,
                        'read_at'    => $message->read_at,
                        'is_mine'    => $message->sender_id === $authId,
                    ],
                ];
            }
        }

        return response()->json(array_values($conversations));
    }

    // Get messages between authenticated user and another user
    public function getMessagesWithUser($otherUserId)
    {
        $authId = Auth::id();

        $messages = Message::withTrashed()
            ->where(function ($q) use ($authId, $otherUserId) {
                $q->where('sender_id', $authId)->where('receiver_id', $otherUserId);
            })
            ->orWhere(function ($q) use ($authId, $otherUserId) {
                $q->where('sender_id', $otherUserId)->where('receiver_id', $authId);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        $messageIds  = $messages->pluck('id');
        $myLikedIds  = MessageReaction::whereIn('message_id', $messageIds)
            ->where('user_id', $authId)
            ->pluck('message_id');
        $likeCounts  = MessageReaction::whereIn('message_id', $messageIds)
            ->selectRaw('message_id, count(*) as cnt')
            ->groupBy('message_id')
            ->pluck('cnt', 'message_id');

        $formatted = $messages->map(fn ($m) => [
            'id'          => $m->id,
            'sender_id'   => $m->sender_id,
            'receiver_id' => $m->receiver_id,
            'content'     => $m->deleted_at ? null : $m->content,
            'is_deleted'  => !is_null($m->deleted_at),
            'created_at'  => $m->created_at,
            'read_at'     => $m->read_at,
            'like_count'  => (int) $likeCounts->get($m->id, 0),
            'liked_by_me' => $myLikedIds->contains($m->id),
        ]);

        return response()->json($formatted);
    }

    // Send a message — sender is always Auth::user(), trainer_id auto-derived
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'receiver_id'  => 'required|integer|exists:users,id',
            'content'      => 'required|string|max:1000',
            'scheduled_at' => 'nullable|date',
        ]);

        $sender   = Auth::user();
        $senderId = $sender->id;

        if ($sender->role === 'trainer') {
            $trainerId = $senderId;
        } else {
            $profile   = ClientProfile::where('user_id', $senderId)->first();
            $trainerId = $profile?->trainer_id ?? $validated['receiver_id'];
        }

        $message = Message::create([
            'sender_id'    => $senderId,
            'receiver_id'  => $validated['receiver_id'],
            'trainer_id'   => $trainerId,
            'content'      => $validated['content'],
            'scheduled_at' => $validated['scheduled_at'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => array_merge($message->toArray(), [
                'is_deleted'  => false,
                'like_count'  => 0,
                'liked_by_me' => false,
            ]),
        ], 201);
    }

    // Delete own message (soft delete)
    public function deleteMessage($id)
    {
        $message = Message::where('id', $id)
            ->where('sender_id', Auth::id())
            ->firstOrFail();

        $message->delete();

        return response()->json(['success' => true]);
    }

    // Toggle like on a message
    public function toggleMessageLike($id)
    {
        $authId  = Auth::id();
        $message = Message::findOrFail($id);

        if ($message->sender_id !== $authId && $message->receiver_id !== $authId) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $existing = MessageReaction::where('message_id', $id)
            ->where('user_id', $authId)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            MessageReaction::create([
                'message_id' => $id,
                'user_id'    => $authId,
            ]);
            $liked = true;

            // Notify the message sender (only if it's not the sender liking their own message)
            if ($message->sender_id !== $authId) {
                $liker = Auth::user();
                Notification::create([
                    'user_id' => $message->sender_id,
                    'type'    => 'message_liked',
                    'data'    => [
                        'message' => "{$liker->name} liked your message.",
                    ],
                ]);
            }
        }

        return response()->json([
            'liked'      => $liked,
            'like_count' => MessageReaction::where('message_id', $id)->count(),
        ]);
    }

    // Mark a specific message as read (only if you're the receiver)
    public function markAsRead($messageId)
    {
        $message = Message::where('id', $messageId)
            ->where('receiver_id', Auth::id())
            ->firstOrFail();

        $message->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    // Mark all unread messages as read for authenticated user
    public function markAllAsRead()
    {
        Message::where('receiver_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    // Count unread messages for authenticated user
    public function countUnreadMessages()
    {
        $count = Message::where('receiver_id', Auth::id())
            ->whereNull('read_at')
            ->count();

        return response()->json(['unread_count' => $count]);
    }
}
