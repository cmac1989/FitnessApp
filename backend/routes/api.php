<?php

use App\Http\Controllers\ClientDashboardController;
use App\Http\Controllers\ClientProfileController;
use App\Http\Controllers\ClientSessionController;
use App\Http\Controllers\ClientWorkoutController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TrainerProfileController;
use App\Http\Controllers\TrainingSessionController;
use App\Http\Controllers\TrainerDashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkoutController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Log;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [UserController::class, 'getUserProfile']);

    Route::prefix('client')->group(function () {
        Route::get('/dashboard', [ClientDashboardController::class, 'getDashboard']);
        Route::get('/stats', [ClientDashboardController::class, 'getStats']); // alias
        Route::get('/sessions', [ClientSessionController::class, 'index']);
        Route::get('/sessions/{id}', [ClientSessionController::class, 'show']);
        Route::get('/workouts', [ClientWorkoutController::class, 'index']);
        Route::get('/workouts/{id}', [ClientWorkoutController::class, 'show']);
        Route::get('/profile', [ClientProfileController::class, 'getProfile']);
        Route::patch('/profile/{id}', [ClientProfileController::class, 'updateProfile']);

        // Goals
        Route::get('/goal', [ClientDashboardController::class, 'getGoal']);
        Route::post('/goal', [ClientDashboardController::class, 'setGoal']);
        Route::patch('/goal/{id}', [ClientDashboardController::class, 'updateGoal']);

        // Metrics
        Route::post('/metrics', [ClientDashboardController::class, 'logMetric']);
        Route::get('/metrics/{type}', [ClientDashboardController::class, 'getMetrics']);

        // Messages — order matters: specific routes before wildcards
        Route::get('/messages/conversations', [MessageController::class, 'getLatestMessagesPerConversation']);
        Route::post('/messages/mark-as-read', [MessageController::class, 'markAllAsRead']);
        Route::get('/messages/{otherUserId}', [MessageController::class, 'getMessagesWithUser']);
        Route::post('/messages', [MessageController::class, 'sendMessage']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAllAsRead']);
        Route::get('/notifications/{id}', [NotificationController::class, 'show']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    });

    Route::prefix('trainer')->group(function () {
        Route::get('/dashboard', [TrainerDashboardController::class, 'getDashboard']);
        Route::get('/stats', [TrainerDashboardController::class, 'getStats']);

        Route::apiResource('training-sessions', TrainingSessionController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::get('/clients', [ClientProfileController::class, 'clients']);

        Route::get('/trainer-profile', [TrainerProfileController::class, 'getTrainerProfile']);
        Route::patch('/trainer-profile/{id}', [TrainerProfileController::class, 'update']);

        Route::apiResource('workouts', WorkoutController::class)->only(['store', 'update', 'destroy']);
        Route::get('/workouts/', [WorkoutController::class, 'getTrainerWorkouts']);
        Route::get('/workouts/{id}', [WorkoutController::class, 'getTrainerWorkout']);

        // Messages — order matters: specific routes before wildcards
        Route::get('/messages/unread-count', [MessageController::class, 'countUnreadMessages']);
        Route::get('/messages/conversations', [MessageController::class, 'getLatestMessagesPerConversation']);
        Route::post('/messages/mark-as-read', [MessageController::class, 'markAllAsRead']);
        Route::get('/messages/{otherUserId}', [MessageController::class, 'getMessagesWithUser']);
        Route::get('/messages', [MessageController::class, 'index']);
        Route::post('/messages', [MessageController::class, 'sendMessage']);
        Route::post('/messages/{messageId}/read', [MessageController::class, 'markAsRead']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAllAsRead']);
        Route::get('/notifications/{id}', [NotificationController::class, 'show']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    });
});
