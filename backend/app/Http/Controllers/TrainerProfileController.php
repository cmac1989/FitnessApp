<?php

namespace App\Http\Controllers;

use App\Models\TrainerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

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

        $trainer = User::find(auth()->id());
        $trainerProfile = $trainer->trainerProfile
            ?? TrainerProfile::create(['user_id' => $trainer->id]);

        // Validate the incoming data
        $validatedData = $request->validate([
            'name' => 'nullable|string|max:255',
            'certifications' => 'nullable|string|max:255',
            'years_experience' => 'nullable|integer|min:0',
            'specialties' => 'nullable|array',
            'specialties.*' => 'nullable|string|max:1000',
            'availability' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:500',
        ]);

        // Start a transaction to ensure atomic updates
        DB::beginTransaction();

        try {
            // Update the trainer profile (trainer_profiles table)
            $trainerProfile->update([
                'certifications' => $validatedData['certifications'] ?? $trainerProfile->certifications,
                'years_experience' => $validatedData['years_experience'] ?? $trainerProfile->years_experience,
                'specialties' => $validatedData['specialties'] ?? $trainerProfile->specialties,
                'availability' => $validatedData['availability'] ?? $trainerProfile->availability,
                'location' => $validatedData['location'] ?? $trainerProfile->location,
            ]);

            // Also update the bio/name in the users table if provided
            $user = $trainer;
            if (isset($validatedData['bio']) || isset($validatedData['name'])) {
                $user->update([
                    'bio' => $validatedData['bio'] ?? $user->bio,
                    'name' => $validatedData['name'] ?? $user->name,
                ]);
            }

            // Commit the transaction
            DB::commit();

            // Return a success response
            return response()->json([
                'message' => 'Trainer profile updated successfully',
                'profile' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'certifications' => $trainerProfile->certifications,
                    'years_experience' => $trainerProfile->years_experience,
                    'specialties' => $trainerProfile->specialties,
                    'availability' => $trainerProfile->availability,
                    'location' => $trainerProfile->location,
                    'bio' => $user->bio,
                    'profile_picture' => $user->profile_picture,
                ],
            ]);

        } catch (\Exception $e) {
            // If something goes wrong, rollback the transaction
            DB::rollBack();
            return response()->json(['error' => 'Failed to update trainer profile'], 500);
        }
    }
}
