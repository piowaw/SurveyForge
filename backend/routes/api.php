<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CollaboratorController;
use App\Http\Controllers\Api\PublicSurveyController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\ResultsController;
use App\Http\Controllers\Api\SurveyController;
use Illuminate\Support\Facades\Route;

// Auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum'); // Logout requires authentication
});

// User profile routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);
    Route::delete('/me', [AuthController::class, 'deleteAccount']);
});

// Meta routes (Gives all question types and their properties)
Route::prefix('meta')->group(function () {
    Route::get('/question-types', function () {
        return response()->json(
            collect(\App\Enums\QuestionType::cases())->map(fn (\App\Enums\QuestionType $t) => [
                'value'           => $t->value,
                'requiresOptions' => $t->requiresOptions(),
                'isChoiceBased'   => $t->isChoiceBased(),
            ])->values()
        );
    });
});

// Public survey routes
Route::prefix('public/surveys')->group(function () {
    Route::get('/{slug}', [PublicSurveyController::class, 'show']);
    Route::post('/{slug}/responses', [PublicSurveyController::class, 'submitResponse']);
});

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {

    // Surveys actions
    Route::apiResource('surveys', SurveyController::class);
    Route::post('/surveys/{survey}/publish', [SurveyController::class, 'publish']);
    Route::post('/surveys/{survey}/favorite', [SurveyController::class, 'toggleFavorite']);
    Route::post('/surveys/{survey}/duplicate', [SurveyController::class, 'duplicate']);

    // Questions
    Route::post('/surveys/{survey}/questions', [QuestionController::class, 'store']);
    Route::put('/questions/{question}', [QuestionController::class, 'update']);
    Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);
    Route::post('/surveys/{survey}/questions/reorder', [QuestionController::class, 'reorder']);

    // Collaborators
    Route::post('/surveys/{survey}/collaborators', [CollaboratorController::class, 'store']);
    Route::delete('/surveys/{survey}/collaborators/{userId}', [CollaboratorController::class, 'destroy']);

    // Results and export
    Route::get('/surveys/{survey}/results', [ResultsController::class, 'results']);
    Route::get('/surveys/{survey}/responses', [ResultsController::class, 'responses']);
    Route::delete('/surveys/{survey}/responses/{response}', [ResultsController::class, 'deleteResponse']);
    Route::get('/surveys/{survey}/export', [ResultsController::class, 'export']);

    // Admin routes (Requires admin middleware)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::get('/surveys', [AdminController::class, 'surveys']);
        Route::delete('/surveys/{survey}', [AdminController::class, 'deleteSurvey']);
    });
});

// API 404 fallback
Route::fallback(function () {
    return response()->json(['message' => 'API endpoint not found.'], 404);
});
