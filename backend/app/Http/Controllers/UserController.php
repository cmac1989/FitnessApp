<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function getUserProfile(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'profile_picture' => $user->profile_picture,
            'bio' => $user->bio,
        ]);
    }

    public function getTrainerProfile(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'trainer') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $profile = $user->trainerProfile;

        if (!$profile) {
            return response()->json(['error' => 'Trainer profile not found'], 404);
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'profile_picture' => $user->profile_picture,
            'certifications' => $profile->certifications,
            'years_experience' => $profile->years_experience,
            'specialties' => $profile->specialties,
            'availability' => $profile->availability,
            'location' => $profile->location,
            'bio' => $profile->bio,
        ]);
    }
}
