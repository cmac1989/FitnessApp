<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AvatarController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'avatar_base64' => 'required|string',
            'avatar_type'   => 'nullable|string',
        ]);

        $user = $request->user();
        $mime = $request->input('avatar_type', 'image/jpeg');
        $ext  = match(true) {
            str_contains($mime, 'png')  => 'png',
            str_contains($mime, 'webp') => 'webp',
            default                     => 'jpg',
        };

        $data = base64_decode($request->input('avatar_base64'));

        // Remove any previous avatar for this user
        foreach (['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] as $old) {
            Storage::disk('public')->delete("avatars/{$user->id}.{$old}");
        }

        $filename = "avatars/{$user->id}.{$ext}";
        Storage::disk('public')->put($filename, $data);
        $url = url(Storage::url($filename));

        $user->update(['profile_picture' => $url]);

        return response()->json(['profile_picture' => $url]);
    }
}
