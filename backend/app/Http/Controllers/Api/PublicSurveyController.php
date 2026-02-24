<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitResponseRequest;
use App\Models\Survey;
use App\Services\ResponseService;
use Illuminate\Http\JsonResponse;

// Handles public survey display and response
class PublicSurveyController extends Controller
{
    public function __construct(
        private readonly ResponseService $responseService,
    ) {}

    // Get survey by slug
    public function show(string $slug): JsonResponse
    {
        $survey = Survey::where('slug', $slug)
            ->where('status', 'published')
            ->where('is_public', true)
            ->with('questions')
            ->first();

        if (! $survey) {
            return response()->json([
                'message' => 'Survey not found or not available.',
            ], 404);
        }

        return response()->json($survey);
    }

    // Submit a response to a survey
    public function submitResponse(SubmitResponseRequest $request, string $slug): JsonResponse
    {
        $survey = Survey::where('slug', $slug)
            ->where('status', 'published')
            ->where('is_public', true)
            ->with('questions')
            ->first();

        if (! $survey) {
            return response()->json([
                'message' => 'Survey not found or not available for submission.',
            ], 404);
        }

        // Check if survey is accepting responses
        if (! $survey->is_accepting_responses) {
            return response()->json([
                'message' => 'This survey is currently closed.',
            ], 403);
        }

        $now = now();
        if ($survey->opens_at && $now->lt($survey->opens_at)) {
            return response()->json([
                'message' => 'This survey is not open yet.',
            ], 403);
        }

        if ($survey->closes_at && $now->gt($survey->closes_at)) {
            return response()->json([
                'message' => 'This survey has been closed.',
            ], 403);
        }

        // Check access password
        if ($survey->access_password) {
            if ($request->input('password') !== $survey->access_password) {
                return response()->json([
                    'message' => 'Invalid survey password.',
                ], 403);
            }
        }

        // Validate required respondent info
        if ($survey->require_name && ! $request->filled('respondent_name')) {
            return response()->json([
                'message' => 'Name is required for this survey.',
                'errors' => ['respondent_name' => ['Name is required.']],
            ], 422);
        }

        if ($survey->require_email && ! $request->filled('respondent_email')) {
            return response()->json([
                'message' => 'Email is required for this survey.',
                'errors' => ['respondent_email' => ['Email is required.']],
            ], 422);
        }

        $response = $this->responseService->submit(
            $survey,
            $request->validated('answers'),
            $request->input('respondent_name'),
            $request->input('respondent_email'),
        );

        return response()->json([
            'message' => 'Response submitted successfully.',
            'response_id' => $response->id,
        ], 201);
    }
}
