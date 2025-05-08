<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

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
}
