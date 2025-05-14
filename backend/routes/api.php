<?php

use App\Http\Controllers\ClientProfileController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
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
        //TODO hook all the below up to the front end
        Route::get('/messages', [MessageController::class, 'index']);
        Route::get('/messages/conversations', [MessageController::class, 'getLatestMessagesPerConversation']);
        Route::get('/messages/{otherUserId}', [MessageController::class, 'getMessagesWithUser']);

        Route::post('/messages', [MessageController::class, 'sendMessage']);
        Route::post('/messages/{messageId}/read', [MessageController::class, 'markAsRead']);
        Route::get('/messages/unread-count', [MessageController::class, 'countUnreadMessages']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/{id}', [NotificationController::class, 'show']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::get('/notifications/unread/count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        //TODO dont know if i'll need this
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    });
});
