<?php

namespace App\Http\Controllers;

use App\Models\ClientInvitation;
use App\Models\ClientProfile;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ClientInvitationController extends Controller
{
    // ── Trainer: send an invitation ───────────────────────────────────────────

    public function store(Request $request)
    {
        $trainer = Auth::user();

        $request->validate([
            'email' => 'required|email',
        ]);

        $client = User::where('email', $request->email)
            ->where('role', 'client')
            ->first();

        if (!$client) {
            return response()->json(['error' => 'No client account found with that email address.'], 404);
        }

        if ($client->id === $trainer->id) {
            return response()->json(['error' => 'You cannot invite yourself.'], 422);
        }

        // Already linked?
        $alreadyLinked = ClientProfile::where('user_id', $client->id)
            ->where('trainer_id', $trainer->id)
            ->exists();

        if ($alreadyLinked) {
            return response()->json(['error' => 'This client is already linked to you.'], 422);
        }

        // Already has a live pending invite?
        $existing = ClientInvitation::where('trainer_id', $trainer->id)
            ->where('client_id', $client->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->exists();

        if ($existing) {
            return response()->json(['error' => 'You already have a pending invitation for this client.'], 422);
        }

        $invitation = ClientInvitation::create([
            'trainer_id' => $trainer->id,
            'client_id'  => $client->id,
            'token'      => Str::random(64),
            'status'     => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        // Notify the client
        Notification::create([
            'user_id' => $client->id,
            'type'    => 'trainer_invite',
            'data'    => [
                'message'          => "{$trainer->name} has invited you to be their client.",
                'invitation_token' => $invitation->token,
                'trainer_name'     => $trainer->name,
                'trainer_id'       => $trainer->id,
            ],
        ]);

        return response()->json([
            'message'    => 'Invitation sent to ' . $client->name . '.',
            'invitation' => [
                'id'          => $invitation->id,
                'client_name' => $client->name,
                'client_email'=> $client->email,
                'status'      => $invitation->status,
                'expires_at'  => $invitation->expires_at->toDateString(),
            ],
        ], 201);
    }

    // ── Trainer: list their pending invitations ───────────────────────────────

    public function index()
    {
        $trainer = Auth::user();

        $invitations = ClientInvitation::with('client')
            ->where('trainer_id', $trainer->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($i) => [
                'id'           => $i->id,
                'client_name'  => $i->client->name,
                'client_email' => $i->client->email,
                'expires_at'   => $i->expires_at->toDateString(),
            ]);

        return response()->json($invitations);
    }

    // ── Trainer: cancel an invitation ─────────────────────────────────────────

    public function destroy($id)
    {
        $trainer    = Auth::user();
        $invitation = ClientInvitation::where('id', $id)
            ->where('trainer_id', $trainer->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $invitation->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Invitation cancelled.']);
    }

    // ── Client: list pending invitations for them ─────────────────────────────

    public function pendingForClient()
    {
        $client = Auth::user();

        $invitations = ClientInvitation::with('trainer')
            ->where('client_id', $client->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($i) => [
                'id'             => $i->id,
                'token'          => $i->token,
                'trainer_name'   => $i->trainer->name,
                'trainer_email'  => $i->trainer->email,
                'trainer_photo'  => $i->trainer->profile_picture,
                'expires_at'     => $i->expires_at->toDateString(),
            ]);

        return response()->json($invitations);
    }

    // ── Client: accept an invitation ──────────────────────────────────────────

    public function accept($token)
    {
        $client = Auth::user();

        $invitation = ClientInvitation::with('trainer')
            ->where('token', $token)
            ->where('client_id', $client->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->firstOrFail();

        // Link trainer to client profile
        ClientProfile::firstOrCreate(['user_id' => $client->id])
            ->update(['trainer_id' => $invitation->trainer_id]);

        $invitation->update(['status' => 'accepted']);

        // Notify trainer
        Notification::create([
            'user_id' => $invitation->trainer_id,
            'type'    => 'invite_accepted',
            'data'    => [
                'message'     => "{$client->name} accepted your invitation.",
                'client_id'   => $client->id,
                'client_name' => $client->name,
            ],
        ]);

        return response()->json([
            'message' => 'You are now linked to ' . $invitation->trainer->name . '.',
        ]);
    }

    // ── Client: decline an invitation ─────────────────────────────────────────

    public function decline($token)
    {
        $client = Auth::user();

        $invitation = ClientInvitation::with('trainer')
            ->where('token', $token)
            ->where('client_id', $client->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $invitation->update(['status' => 'declined']);

        // Notify trainer
        Notification::create([
            'user_id' => $invitation->trainer_id,
            'type'    => 'invite_declined',
            'data'    => [
                'message'     => "{$client->name} declined your invitation.",
                'client_id'   => $client->id,
                'client_name' => $client->name,
            ],
        ]);

        return response()->json(['message' => 'Invitation declined.']);
    }
}
