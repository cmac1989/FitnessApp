<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    // Get all messages for the authenticated user (as sender or receiver)
    public function index()
    {
        $messages = Message::where('sender_id', Auth::id())
            ->orWhere('receiver_id', Auth::id())
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    public function getLatestMessagesPerConversation()
    {
        $authId = Auth::id();  // Get authenticated user's ID

        // Retrieve messages where the authenticated user is either sender or receiver
        $messages = Message::with(['sender', 'receiver'])
            ->where(function ($query) use ($authId) {
                $query->where('sender_id', $authId)
                    ->orWhere('receiver_id', $authId);
            })
            ->orderBy('created_at', 'desc')  // Get messages in descending order by creation date
            ->get();

        $conversations = [];

        foreach ($messages as $message) {
            // Determine the other user in this message
            $otherUser = $message->sender_id === $authId
                ? $message->receiver
                : $message->sender;

            // Only keep the latest message per conversation
            if (!isset($conversations[$otherUser->id])) {
                $conversations[$otherUser->id] = [
                    'user' => [
                        'id'   => $otherUser->id,
                        'name' => $otherUser->name,
                    ],
                    'last_message' => [
                        'content'    => $message->content,
                        'created_at' => $message->created_at,
                    ]
                ];
            }
        }

        return response()->json(array_values($conversations));
    }



    // Get messages between the authenticated user and another user
    public function getMessagesWithUser($otherUserId)
    {
        $messages = Message::where(function ($query) use ($otherUserId) {
            $query->where('sender_id', Auth::id())
                ->where('receiver_id', $otherUserId);
        })
            ->orWhere(function ($query) use ($otherUserId) {
                $query->where('sender_id', $otherUserId)
                    ->where('receiver_id', Auth::id());
            })
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    // Send a message from the authenticated user
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'sender_id'    => 'required|integer|exists:users,id',
            'receiver_id'  => 'required|integer|exists:users,id',
            'trainer_id'   => 'required|integer|exists:users,id',
            'content'      => 'required|string|max:1000',
            'scheduled_at' => 'nullable|date',
        ]);

        $message = Message::create([
            'sender_id'    => $validated['sender_id'],
            'receiver_id'  => $validated['receiver_id'],
            'trainer_id'   => $validated['trainer_id'],
            'content'      => $validated['content'],
            'scheduled_at' => $validated['scheduled_at'],
        ]);

        return response()->json([
            'success' => true,
            'message' => $message,
        ], 201);
    }

    // Mark a specific message as read (only if you’re the receiver)
    public function markAsRead($messageId)
    {
        $message = Message::where('id', $messageId)
            ->where('receiver_id', Auth::id())
            ->firstOrFail();

        $message->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Message marked as read.',
        ]);
    }

    // Get count of unread messages for authenticated user
    public function countUnreadMessages()
    {
        $count = Message::where('receiver_id', Auth::id())
            ->whereNull('read_at')
            ->count();

        return response()->json(['unread_count' => $count]);
    }
}
