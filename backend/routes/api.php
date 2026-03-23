<?php

use App\Http\Controllers\ClientDashboardController;
use App\Http\Controllers\ClientInvitationController;
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
use App\Http\Controllers\AIWorkoutController;
use App\Http\Controllers\CheckInController;
use App\Http\Controllers\WorkoutAssignmentController;
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
        Route::patch('/profile', [ClientProfileController::class, 'updateProfile']);

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
        Route::delete('/messages/{id}', [MessageController::class, 'deleteMessage']);
        Route::post('/messages/{id}/like', [MessageController::class, 'toggleMessageLike']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAllAsRead']);
        Route::get('/notifications/{id}', [NotificationController::class, 'show']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

        // Invitations — specific routes before wildcard
        Route::get('/invitations/pending', [ClientInvitationController::class, 'pendingForClient']);
        Route::post('/invitations/{token}/accept', [ClientInvitationController::class, 'accept']);
        Route::post('/invitations/{token}/decline', [ClientInvitationController::class, 'decline']);

        // Schedule
        Route::get('/schedule', [WorkoutController::class, 'clientSchedule']);
        Route::get('/schedule/{id}',          [WorkoutAssignmentController::class, 'show']);
        Route::patch('/schedule/{id}/complete', [WorkoutAssignmentController::class, 'complete']);
        Route::post('/schedule/{id}/like',    [WorkoutAssignmentController::class, 'toggleLike']);
        Route::get('/schedule/{id}/comments', [WorkoutAssignmentController::class, 'comments']);
        Route::post('/schedule/{id}/comments', [WorkoutAssignmentController::class, 'addComment']);
        Route::delete('/schedule/{id}/comments/{commentId}', [WorkoutAssignmentController::class, 'deleteComment']);
        Route::post('/schedule/{id}/comments/{commentId}/like', [WorkoutAssignmentController::class, 'toggleCommentLike']);

        // Check-ins
        Route::get('/check-ins', [CheckInController::class, 'clientIndex']);
        Route::get('/check-ins/{id}', [CheckInController::class, 'show']);
        Route::patch('/check-ins/{id}/complete', [CheckInController::class, 'clientComplete']);
    });

    Route::prefix('trainer')->group(function () {
        Route::get('/dashboard', [TrainerDashboardController::class, 'getDashboard']);
        Route::get('/stats', [TrainerDashboardController::class, 'getStats']);

        Route::apiResource('training-sessions', TrainingSessionController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::get('/clients', [ClientProfileController::class, 'clients']);

        // Invitations
        Route::get('/invitations', [ClientInvitationController::class, 'index']);
        Route::post('/invitations', [ClientInvitationController::class, 'store']);
        Route::delete('/invitations/{id}', [ClientInvitationController::class, 'destroy']);

        Route::get('/trainer-profile', [TrainerProfileController::class, 'getTrainerProfile']);
        Route::patch('/trainer-profile/{id}', [TrainerProfileController::class, 'update']);

        Route::post('/workouts/generate', [AIWorkoutController::class, 'generate']);
        Route::apiResource('workouts', WorkoutController::class)->only(['store', 'update', 'destroy']);
        Route::get('/workouts/', [WorkoutController::class, 'getTrainerWorkouts']);
        Route::get('/workouts/{id}', [WorkoutController::class, 'getTrainerWorkout']);
        Route::post('/workouts/{id}/assign', [WorkoutController::class, 'assign']);
        Route::post('/workouts/{id}/assign-batch', [WorkoutController::class, 'batchAssign']);

        // Messages — order matters: specific routes before wildcards
        Route::get('/messages/unread-count', [MessageController::class, 'countUnreadMessages']);
        Route::get('/messages/conversations', [MessageController::class, 'getLatestMessagesPerConversation']);
        Route::post('/messages/mark-as-read', [MessageController::class, 'markAllAsRead']);
        Route::get('/messages/{otherUserId}', [MessageController::class, 'getMessagesWithUser']);
        Route::get('/messages', [MessageController::class, 'index']);
        Route::post('/messages', [MessageController::class, 'sendMessage']);
        Route::delete('/messages/{id}', [MessageController::class, 'deleteMessage']);
        Route::post('/messages/{id}/like', [MessageController::class, 'toggleMessageLike']);
        Route::post('/messages/{messageId}/read', [MessageController::class, 'markAsRead']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAllAsRead']);
        Route::get('/notifications/{id}', [NotificationController::class, 'show']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

        // Client assignments (trainer view)
        Route::get('/clients/{clientId}/schedule',          [WorkoutAssignmentController::class, 'trainerClientSchedule']);
        Route::get('/schedule/{id}',                        [WorkoutAssignmentController::class, 'show']);
        Route::post('/schedule/{id}/like',                  [WorkoutAssignmentController::class, 'toggleLike']);
        Route::get('/schedule/{id}/comments',               [WorkoutAssignmentController::class, 'comments']);
        Route::post('/schedule/{id}/comments',              [WorkoutAssignmentController::class, 'addComment']);
        Route::delete('/schedule/{id}/comments/{commentId}', [WorkoutAssignmentController::class, 'deleteComment']);
        Route::post('/schedule/{id}/comments/{commentId}/like', [WorkoutAssignmentController::class, 'toggleCommentLike']);

        // Check-ins
        Route::get('/check-ins', [CheckInController::class, 'trainerIndex']);
        Route::post('/check-ins', [CheckInController::class, 'trainerStore']);
        Route::post('/check-ins/batch', [CheckInController::class, 'batchStore']);
        Route::get('/check-ins/{id}', [CheckInController::class, 'trainerShow']);
        Route::patch('/check-ins/{id}/review', [CheckInController::class, 'review']);
    });
});
