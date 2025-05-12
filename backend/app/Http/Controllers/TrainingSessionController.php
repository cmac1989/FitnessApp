<?php

namespace App\Http\Controllers;

use App\Models\TrainingSession;
use App\Models\User;
use Illuminate\Http\Request;

class TrainingSessionController extends Controller
{
    // Grab all sessions
    public function index() {
        $sessions = TrainingSession::with('client')->get();
        return response()->json($sessions);
    }

    // Create session
    public function store(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string|exists:users,name', // Validate by name
            'scheduled_at' => 'required|date',
            'location' => 'required|string',
        ]);

        // Find the client by name
        $client = User::where('name', $request->client_name)->where('role', 'client')->first();

        if (!$client) {
            return response()->json(['message' => 'Client not found or not a valid client'], 404);
        }

        // Get the authenticated user (trainer)
        $trainer = auth()->user();

        if ($trainer->role !== 'trainer') {
            return response()->json(['message' => 'Authenticated user is not a trainer'], 403);
        }

        // Create the session
        $session = new TrainingSession();
        $session->client_id = $client->id;  // Store the client ID
        $session->trainer_id = $trainer->id;  // Use the authenticated trainer's ID
        $session->scheduled_at = $request->scheduled_at;
        $session->location = $request->location;
        $session->save();

        return response()->json(['message' => 'Session created successfully'], 201);
    }

    //update sessions
    public function update(Request $request, $id) {
        $trainingSession = TrainingSession::find($id);

        if(!$trainingSession) {
            return response()->json(['message' => 'Training session not found'], 404);
        }

        $validatedData = $request->validate([
            'location' => 'nullable|string',
            'status' => 'nullable|string',
            'scheduled_at' => 'nullable|date'
        ]);

        $trainingSession->update($validatedData);

        return response()->json([
            'message' => 'Training session updated successfully',
            'training_session' => $trainingSession
        ]);
    }

    //delete sessions
    public function destroy($id) {
        $session = TrainingSession::find($id);

        if(!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $session->delete();
        return response()->json(['message' => 'Session deleted successfully']);
    }
}
