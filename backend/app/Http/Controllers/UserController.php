<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function clients(Request $request)
    {
        $clients = User::where('role', 'client')
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($clients);
    }
}
