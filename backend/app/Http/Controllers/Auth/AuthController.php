<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        Log::info('Register request payload:', $request->all());

        // Common validation rules
        $commonRules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|string|in:client,trainer,admin',
            'profile_picture' => 'nullable|string',
            'bio' => 'nullable|string|max:500',
        ];

        // Role-specific validation
        $clientRules = [
            'age' => 'nullable|integer',
            'gender' => 'nullable|in:M,F,O',
            'fitness_goals' => 'nullable|string',
            'medical_conditions' => 'nullable|string',
        ];

        $trainerRules = [
            'certifications' => 'nullable|string',
            'years_experience' => 'nullable|integer',
            'specialties' => 'nullable|string',
            'availability' => 'nullable|string',
            'location' => 'nullable|string',
        ];

        // Validate common fields first
        $fields = $request->validate($commonRules);

        // Validate role-specific fields
        if ($request->role === 'client') {
            $fields += $request->validate($clientRules);
        } elseif ($request->role === 'trainer') {
            $fields += $request->validate($trainerRules);
        }

        DB::beginTransaction();

        try {
            // Create user
            $user = User::create([
                'name' => $fields['name'],
                'email' => $fields['email'],
                'password' => Hash::make($fields['password']),
                'role' => $fields['role'],
                'profile_picture' => $fields['profile_picture'] ?? null,
                'bio' => $fields['bio'] ?? null,
            ]);

            // Create client profile
            if ($user->role === 'client') {
                ClientProfile::create([
                    'user_id' => $user->id,
                    'age' => $fields['age'] ?? null,
                    'gender' => $fields['gender'] ?? null,
                    'fitness_goals' => $fields['fitness_goals'] ?? null,
                    'medical_conditions' => $fields['medical_conditions'] ?? null,
                ]);
            }

            // Create trainer profile
            if ($user->role === 'trainer') {
                TrainerProfile::create([
                    'user_id' => $user->id,
                    'certifications' => $fields['certifications'] ?? null,
                    'years_experience' => $fields['years_experience'] ?? null,
                    'specialties' => $fields['specialties'] ?? null,
                    'availability' => $fields['availability'] ?? null,
                    'location' => $fields['location'] ?? null,
                ]);
            }

            DB::commit();

            // Generate token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Return response
            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'profile_picture' => $user->profile_picture,
                    'bio' => $user->bio,
                ],
                'token' => $token,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Find user by email
        $user = User::where('email', $fields['email'])->first();

        // Check credentials
        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Generate token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'profile_picture' => $user->profile_picture,
                'bio' => $user->bio,
            ],
            'token' => $token,
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
