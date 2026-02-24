<?php

namespace App\Services;

use App\Models\Response;
use App\Models\Survey;
use Illuminate\Support\Facades\DB;

// Public survey response submission.
class ResponseService
{
    // Submit a new response to a survey
    public function submit(
        Survey $survey,
        array $answers,
        ?string $respondentName = null,
        ?string $respondentEmail = null,
    ): Response {
        return DB::transaction(function () use ($survey, $answers, $respondentName, $respondentEmail) {
            $response = $survey->responses()->create([
                'respondent_name'  => $respondentName,
                'respondent_email' => $respondentEmail,
            ]);

            foreach ($answers as $answerData) {
                $response->answers()->create([
                    'question_id' => $answerData['question_id'],
                    'value'       => $answerData['value'],
                ]);
            }

            return $response->load('answers');
        });
    }
}
