<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClientProfileController extends Controller
{
    public function clients(Request $request)
    {
        $clients = User::with('clientProfile')
            ->where('role', 'client')
            ->orderBy('name')
            ->get();

        return response()->json($clients);
    }

    public function getProfile(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'client') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $clientProfile = ClientProfile::with('trainer')
            ->where('user_id', $user->id)
            ->first();

        if (!$clientProfile) {
            return response()->json(['error' => 'Client profile not found'], 404);
        }

        return response()->json([
            'id'                 => $user->id,
            'name'               => $user->name,
            'email'              => $user->email,
            'age'                => $clientProfile->age,
            'gender'             => $clientProfile->gender,
            'fitness_goals'      => $clientProfile->fitness_goals,
            'medical_conditions' => $clientProfile->medical_conditions,
            'trainer_name'       => $clientProfile->trainer?->name,
        ]);
    }

    public function updateProfile(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'client') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $clientProfile = ClientProfile::where('user_id', $user->id)->first();

        if (!$clientProfile) {
            return response()->json(['error' => 'Profile not found'], 404);
        }

        $validated = $request->validate([
            'name'               => 'nullable|string|max:255',
            'age'                => 'nullable|integer|min:0',
            'gender'             => 'nullable|string|max:50',
            'fitness_goals'      => 'nullable|string|max:1000',
            'medical_conditions' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();

        try {
            $clientProfile->update([
                'age'                => $validated['age'] ?? $clientProfile->age,
                'gender'             => $validated['gender'] ?? $clientProfile->gender,
                'fitness_goals'      => $validated['fitness_goals'] ?? $clientProfile->fitness_goals,
                'medical_conditions' => $validated['medical_conditions'] ?? $clientProfile->medical_conditions,
            ]);

            if (isset($validated['name'])) {
                $user->update(['name' => $validated['name']]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Profile updated successfully',
                'profile' => [
                    'id'                 => $user->id,
                    'name'               => $user->name,
                    'email'              => $user->email,
                    'age'                => $clientProfile->age,
                    'gender'             => $clientProfile->gender,
                    'fitness_goals'      => $clientProfile->fitness_goals,
                    'medical_conditions' => $clientProfile->medical_conditions,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update profile'], 500);
        }
    }
}
