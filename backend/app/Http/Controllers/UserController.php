<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function getUserProfile(Request $request)
    {
        // Fetch the authenticated user profile
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
    public function getTrainerProfile(Request $request) {
        $trainer = auth()->user();
        $user = response()->user();

        if ($user->role !== 'trainer') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'id' => $trainer->id,
            'name' => $trainer->name,
            'email' => $trainer->email,
            'certifications' => $trainer->certifications,
            'years_experience' => $trainer->years_experience,
            'specialties' => $trainer->specialties,
            'availability' => $trainer->availability,
            'location' => $trainer->location,
            'bio' => $trainer->bio,
            'profile_picture' => $trainer->profile_picture,
        ]);

    }
}
