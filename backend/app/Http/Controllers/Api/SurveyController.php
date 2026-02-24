<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSurveyRequest;
use App\Http\Requests\UpdateSurveyRequest;
use App\Models\Survey;
use App\Services\SurveyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


// Operations for surveys
class SurveyController extends Controller
{
    public function __construct(
        private readonly SurveyService $surveyService,
    ) {}

    // List surveys owned by or collaborated
    public function index(Request $request): JsonResponse
    {
        $surveys = $this->surveyService->listForUser($request->user());

        return response()->json($surveys);
    }

    // Create
    public function store(StoreSurveyRequest $request): JsonResponse
    {
        $survey = $this->surveyService->create(
            $request->user(),
            $request->validated(),
        );

        return response()->json($survey->load('questions'), 201);
    }

    // Show
    public function show(Request $request, Survey $survey): JsonResponse
    {
        $this->authorize('view', $survey);

        $user = $request->user();
        $survey->load(['questions', 'collaborators', 'owner:id,name,email']);
        $survey->is_favorited = $user
            ->favoriteSurveys()
            ->where('surveys.id', $survey->id)
            ->exists();

        // Current user role
        if ($survey->owner_id === $user->id) {
            $survey->user_role = 'owner';
        } else {
            $pivot = $survey->collaborators->firstWhere('id', $user->id);
            $survey->user_role = $pivot ? $pivot->pivot->role : 'viewer';
        }

        return response()->json($survey);
    }

    // Update survey metadata
    public function update(UpdateSurveyRequest $request, Survey $survey): JsonResponse
    {
        $this->authorize('update', $survey);

        $survey = $this->surveyService->update($survey, $request->validated());

        return response()->json($survey);
    }

    // Delete
    public function destroy(Request $request, Survey $survey): JsonResponse
    {
        $this->authorize('delete', $survey);

        $survey->delete();

        return response()->json(['message' => 'Survey deleted.']);
    }

    // Publish
    public function publish(Request $request, Survey $survey): JsonResponse
    {
        $this->authorize('update', $survey);

        $survey = $this->surveyService->publish($survey);

        return response()->json($survey);
    }

    // Favorite
    public function toggleFavorite(Request $request, Survey $survey): JsonResponse
    {
        $user = $request->user();
        $isFavorited = $user->favoriteSurveys()->where('survey_id', $survey->id)->exists();

        if ($isFavorited) {
            $user->favoriteSurveys()->detach($survey->id);
        } else {
            $user->favoriteSurveys()->attach($survey->id);
        }

        return response()->json(['is_favorited' => ! $isFavorited]);
    }

    // Duplicate a survey
    public function duplicate(Request $request, Survey $survey): JsonResponse
    {
        $this->authorize('view', $survey);

        $newSurvey = $this->surveyService->duplicate($survey, $request->user());

        return response()->json($newSurvey, 201);
    }
}
