<?php

namespace App\Http\Controllers;

use App\Models\TrainingSession;
use Illuminate\Support\Facades\Auth;

class ClientSessionController extends Controller
{
    public function index()
    {
        if (auth()->user()->role !== 'client') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $clientId = Auth::id();

        $sessions = TrainingSession::with('trainer')
            ->where('client_id', $clientId)
            ->orderBy('scheduled_at', 'asc')
            ->get();

        return response()->json($sessions);
    }

    public function show($id)
    {
        if (auth()->user()->role !== 'client') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $clientId = Auth::id();

        $session = TrainingSession::with('trainer')
            ->where('id', $id)
            ->where('client_id', $clientId)
            ->first();

        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        return response()->json($session);
    }
}
