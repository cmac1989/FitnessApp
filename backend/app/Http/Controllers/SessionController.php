<?php

namespace App\Http\Controllers;

use App\Models\TrainingSession;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    // Grab all sessions
    public function index() {
        return TrainingSession::all();
    }

    // Create session
    public function store(Request $request) {
        $validated = $request->validate([
            'client_id' => 'required|exists:users,id',
            'scheduled_at' => 'required|date',
            'location' => 'nullable|string',
            'status' => 'nullable|string|in:scheduled,completed,canceled',
        ]);
        $session = TrainingSession::create($validated);
        return response()->json($session, 201);
    }
    //update sessions

    //delete sessions
}
