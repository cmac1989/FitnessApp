<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class PasswordResetController extends Controller
{
    // ── Send 6-digit reset code ───────────────────────────────────────────────

    public function sendCode(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $email = strtolower(trim($request->email));

        // Rate-limit to 3 attempts per email per 10 minutes
        $key = 'password-reset:' . $email;
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Too many attempts. Please wait {$seconds} seconds before trying again.",
            ], 429);
        }
        RateLimiter::hit($key, 600);

        $user = User::where('email', $email)->first();

        // Always return success to avoid revealing whether email is registered
        if (!$user) {
            return response()->json([
                'message' => 'If that email is registered you will receive a reset code shortly.',
            ]);
        }

        // Generate a 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Replace any existing code for this email
        DB::table('password_reset_codes')->where('email', $email)->delete();
        DB::table('password_reset_codes')->insert([
            'email'      => $email,
            'code'       => Hash::make($code),
            'expires_at' => Carbon::now()->addMinutes(15),
            'created_at' => Carbon::now(),
        ]);

        Mail::to($user->email)->send(new PasswordResetMail($user->name, $code));

        return response()->json([
            'message' => 'If that email is registered you will receive a reset code shortly.',
        ]);
    }

    // ── Reset password using the code ─────────────────────────────────────────

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'code'                  => 'required|string|size:6',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        $email = strtolower(trim($request->email));

        $record = DB::table('password_reset_codes')
            ->where('email', $email)
            ->first();

        if (!$record || !Hash::check($request->code, $record->code)) {
            return response()->json(['message' => 'Invalid or expired reset code.'], 422);
        }

        if (Carbon::parse($record->expires_at)->isPast()) {
            DB::table('password_reset_codes')->where('email', $email)->delete();
            return response()->json(['message' => 'This code has expired. Please request a new one.'], 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid or expired reset code.'], 422);
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->save();

        // Revoke all existing tokens so stale sessions are invalidated
        $user->tokens()->delete();

        // Clean up the used code
        DB::table('password_reset_codes')->where('email', $email)->delete();

        // Clear the rate limiter for this email
        RateLimiter::clear('password-reset:' . $email);

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
