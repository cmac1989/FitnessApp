<?php

namespace App\Http\Controllers;

use App\Models\TrainerProfile;
use Illuminate\Http\Request;

class TrainerProfileController extends Controller
{
    public function getTrainerProfile(Request $request)
    {
        // Get the authenticated user (trainer)
        $trainer = auth()->user();

        // Ensure the authenticated user is a trainer
        if ($trainer->role !== 'trainer') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Fetch the trainer's profile via the relationship
        $trainerProfile = $trainer->trainerProfile;

        // If the trainer profile is not found
        if (!$trainerProfile) {
            return response()->json(['error' => 'Trainer profile not found'], 404);
        }

        // Return the trainer profile data
        return response()->json([
            'id' => $trainer->id,
            'name' => $trainer->name,
            'email' => $trainer->email,
            'certifications' => $trainerProfile->certifications,
            'years_experience' => $trainerProfile->years_experience,
            'specialties' => $trainerProfile->specialties,
            'availability' => $trainerProfile->availability,
            'location' => $trainerProfile->location,
            'bio' => $trainer->bio, // From the user profile
            'profile_picture' => $trainer->profile_picture, // From the user profile
        ]);
    }

    public function update(Request $request, $id) {
        $trainerProfile = TrainerProfile::find($id);

        if (!$trainerProfile) {
            return response()->json(['message' => 'Trainer profile not found'], 404);
        }

        $validatedData = $request->validate([
            'certifications' => 'nullable|string',
            'years_experience' => 'nullable|integer',
            'specialties' => 'nullable|string',
            'availability' => 'nullable|string',
            'location' => 'nullable|string',
            'bio' => 'nullable|string'
        ]);

        $trainerProfile->update($validatedData);

        return response()->json([
            'message' => 'Trainer profile updated successfully',
            'profile' => $trainerProfile
        ]);
    }

}
