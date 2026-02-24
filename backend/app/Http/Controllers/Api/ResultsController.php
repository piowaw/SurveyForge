<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\Response;
use App\Services\ResultsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

// Provides survey results
class ResultsController extends Controller
{
    public function __construct(
        private readonly ResultsService $resultsService,
    ) {}

    // Get results/statistics
    public function results(Request $request, Survey $survey): JsonResponse
    {
        $this->authorize('viewResults', $survey);

        $results = $this->resultsService->getResults($survey);

        return response()->json($results);
    }

    // List individual responses
    public function responses(Request $request, Survey $survey): JsonResponse
    {
        $this->authorize('viewResults', $survey);

        $responses = $survey->responses()
            ->with('answers')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($response) use ($survey) {
                $answers = [];
                foreach ($survey->questions as $question) {
                    $answer = $response->answers->firstWhere('question_id', $question->id);
                    $answers[] = [
                        'question_id' => $question->id,
                        'question_text' => $question->text,
                        'type' => $question->type,
                        'value' => $answer?->value,
                    ];
                }
                return [
                    'id' => $response->id,
                    'respondent_name' => $response->respondent_name,
                    'respondent_email' => $response->respondent_email,
                    'submitted_at' => $response->created_at->toIso8601String(),
                    'answers' => $answers,
                ];
            });

        return response()->json($responses);
    }

    // Delete
    public function deleteResponse(Request $request, Survey $survey, Response $response): JsonResponse
    {
        $this->authorize('update', $survey);

        if ($response->survey_id !== $survey->id) {
            abort(404);
        }

        $response->answers()->delete();
        $response->delete();

        return response()->json(['message' => 'Response deleted']);
    }

    // Export to CSV/Exel
    public function export(Request $request, Survey $survey): JsonResponse|StreamedResponse
    {
        $this->authorize('viewResults', $survey);

        $format = $request->query('format', 'csv');

        if ($format === 'excel') {
            return $this->resultsService->exportExcel($survey); //To be implemented/fixed
        }

        if ($format === 'csv') {
            return $this->resultsService->exportCsv($survey);
        }

        return response()->json($this->resultsService->exportJson($survey));
    }
}
