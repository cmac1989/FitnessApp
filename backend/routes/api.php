<?php

use App\Http\Controllers\TrainingSessionController;
use App\Http\Controllers\TrainerDashboardController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::prefix('trainer')->group(function () {
        Route::get('/stats', [TrainerDashboardController::class, 'getStats']);

        Route::get('/training-sessions', [TrainingSessionController::class, 'index']);
        Route::post('/create-training-session', [TrainingSessionController::class, 'store']);

        Route::get('/clients', [UserController::class, 'clients']);
    });
});
