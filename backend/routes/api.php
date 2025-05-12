<?php

use App\Http\Controllers\ClientProfileController;
use App\Http\Controllers\TrainerProfileController;
use App\Http\Controllers\TrainingSessionController;
use App\Http\Controllers\TrainerDashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkoutController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [UserController::class, 'getUserProfile']);

    Route::prefix('trainer')->group(function () {
        Route::get('/stats', [TrainerDashboardController::class, 'getStats']);

        Route::apiResource('training-sessions', TrainingSessionController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::get('/clients', [ClientProfileController::class, 'clients']);

        Route::get('/trainer-profile', [TrainerProfileController::class, 'getTrainerProfile']);
        Route::patch('/trainer-profile/{id}', [TrainerProfileController::class, 'update']);

        Route::apiResource('workouts', WorkoutController::class)->only(['store', 'update', 'destroy']);
        Route::get('/workouts/', [WorkoutController::class, 'getTrainerWorkouts']);
        Route::get('/workouts/{id}', [WorkoutController::class, 'getTrainerWorkout']);

    });
});
