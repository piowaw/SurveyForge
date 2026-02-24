<?php

namespace App\Services;

use App\Models\Question;
use App\Models\Survey;

// Logic for managing survey questions
class QuestionService
{
    // Create a new question for a survey
    public function create(Survey $survey, array $data): Question
    {
        if (! isset($data['position'])) {
            $data['position'] = $survey->questions()->count();
        }

        return $survey->questions()->create([
            'type'           => $data['type'],
            'text'           => $data['text'],
            'description'    => $data['description'] ?? null,
            'banner_image'   => $data['banner_image'] ?? null,
            'options'        => $data['options'] ?? null,
            'required'       => $data['required'] ?? false,
            'correct_answer' => $data['correct_answer'] ?? null,
            'position'       => $data['position'],
        ]);
    }

    // Update an existing question
    public function update(Question $question, array $data): Question
    {
        $question->update($data);

        return $question->fresh();
    }

    // Reorder questions
    public function reorder(Survey $survey, array $orderedIds): void
    {
        foreach ($orderedIds as $position => $questionId) {
            $survey->questions()
                ->where('id', $questionId)
                ->update(['position' => $position]);
        }
    }
}
