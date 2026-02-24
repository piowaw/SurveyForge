<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestionRequest;
use App\Http\Requests\UpdateQuestionRequest;
use App\Models\Question;
use App\Models\Survey;
use App\Services\QuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Manage survey question
class QuestionController extends Controller
{
    public function __construct(
        private readonly QuestionService $questionService,
    ) {}

    // Add
    public function store(StoreQuestionRequest $request, Survey $survey): JsonResponse
    {
        $this->authorize('update', $survey);

        $question = $this->questionService->create($survey, $request->validated());

        return response()->json($question, 201);
    }

    // Update
    public function update(UpdateQuestionRequest $request, Question $question): JsonResponse
    {
        $this->authorize('update', $question->survey);

        $question = $this->questionService->update($question, $request->validated());

        return response()->json($question);
    }

    // Delete
    public function destroy(Request $request, Question $question): JsonResponse
    {
        $this->authorize('update', $question->survey);

        $question->delete();

        return response()->json(['message' => 'Question deleted.']);
    }

    // Reorder questions for a survey
    public function reorder(Request $request, Survey $survey): JsonResponse
    {
        $this->authorize('update', $survey);

        $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer|exists:questions,id',
        ]);

        $this->questionService->reorder($survey, $request->input('order'));

        return response()->json($survey->fresh('questions')->questions);
    }
}
