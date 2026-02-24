<?php

namespace App\Services;

use App\Enums\QuestionType;
use App\Models\Survey;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Symfony\Component\HttpFoundation\StreamedResponse;

// Survey results and handles export
class ResultsService
{
    // Get aggregated results for a survey
    public function getResults(Survey $survey): array
    {
        $survey->load(['questions', 'responses.answers']);

        $totalResponses = $survey->responses->count();
        $questionResults = [];

        foreach ($survey->questions as $question) {
            $answers = $survey->responses->flatMap(fn ($r) => $r->answers)
                ->where('question_id', $question->id);

            $result = [
                'question_id'   => $question->id,
                'question_text' => $question->text,
                'type'          => $question->type,
                'total_answers' => $answers->count(),
            ];

            $questionType = QuestionType::tryFrom($question->type);

            if ($questionType?->isChoiceBased()) {
                // Aggregate option questions
                $options = $question->options ?? [];
                $counts = array_fill_keys($options, 0);

                foreach ($answers as $answer) {
                    $value = $answer->value;
                    if (is_array($value)) {
                        foreach ($value as $v) {
                            if (isset($counts[$v])) {
                                $counts[$v]++;
                            }
                        }
                    } elseif (isset($counts[$value])) {
                        $counts[$value]++;
                    }
                }

                $result['options'] = [];
                foreach ($counts as $option => $count) {
                    $result['options'][] = [
                        'label'      => $option,
                        'count'      => $count,
                        'percentage' => $answers->count() > 0
                            ? round(($count / $answers->count()) * 100, 1)
                            : 0,
                    ];
                }
            } else {
                // Collect text answers
                $result['text_answers'] = $answers->map(fn ($a) => $a->value)->values()->toArray();
            }

            $questionResults[] = $result;
        }

        return [
            'survey_id'       => $survey->id,
            'survey_title'    => $survey->title,
            'total_responses' => $totalResponses,
            'questions'       => $questionResults,
        ];
    }

    // Export all responses as a JSON (Narazie tylko do testów, potem do usunięcia to mamy)
    public function exportJson(Survey $survey): array
    {
        $survey->load(['questions', 'responses.answers']);

        $rows = [];
        foreach ($survey->responses as $response) {
            $row = [
                'response_id'  => $response->id,
                'submitted_at' => $response->created_at->toIso8601String(),
            ];

            foreach ($survey->questions as $question) {
                $answer = $response->answers->firstWhere('question_id', $question->id);
                $row['q_' . $question->id . '_' . $question->text] = $answer?->value;
            }

            $rows[] = $row;
        }

        return $rows;
    }

    // Export all responses as a CSV
    public function exportCsv(Survey $survey): StreamedResponse
    {
        $survey->load(['questions', 'responses.answers']);

        $questions = $survey->questions;

        return response()->streamDownload(function () use ($survey, $questions) {
            $handle = fopen('php://output', 'w');

            // Write header row
            $headers = ['Response ID', 'Respondent Name', 'Respondent Email', 'Submitted At'];
            foreach ($questions as $question) {
                $headers[] = $question->text;
            }
            fputcsv($handle, $headers);

            // Write data rows
            foreach ($survey->responses as $response) {
                $row = [
                    $response->id,
                    $response->respondent_name ?? '',
                    $response->respondent_email ?? '',
                    $response->created_at->toIso8601String(),
                ];

                foreach ($questions as $question) {
                    $answer = $response->answers->firstWhere('question_id', $question->id);
                    $value = $answer?->value;
                    $row[] = is_array($value) ? implode('; ', $value) : ($value ?? '');
                }

                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $survey->slug . '-results.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    // Export all responses as a XLSX
    public function exportExcel(Survey $survey): StreamedResponse
    {
        $survey->load(['questions', 'responses.answers']);

        $questions = $survey->questions;

        $spreadsheet = new Spreadsheet();

        //Export fix (Do zmiany)

        /** @var Worksheet $sheet */
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setTitle('Responses');

        // Build header row
        $headers = ['Response ID', 'Respondent Name', 'Respondent Email', 'Submitted At'];
        foreach ($questions as $question) {
            $headers[] = $question->text;
        }

        $col = 1;
        foreach ($headers as $header) {
            $colLetter = Coordinate::stringFromColumnIndex($col);
            $cell = $sheet->getCell("{$colLetter}1");
            $cell->setValue($header);
            $cell->getStyle()->getFont()->setBold(true);
            $col++;
        }

        // Write data rows
        $rowNum = 2;
        foreach ($survey->responses as $response) {
            $col = 1;
            $sheet->getCell(Coordinate::stringFromColumnIndex($col++) . $rowNum)->setValue($response->id);
            $sheet->getCell(Coordinate::stringFromColumnIndex($col++) . $rowNum)->setValue($response->respondent_name ?? '');
            $sheet->getCell(Coordinate::stringFromColumnIndex($col++) . $rowNum)->setValue($response->respondent_email ?? '');
            $sheet->getCell(Coordinate::stringFromColumnIndex($col++) . $rowNum)->setValue($response->created_at->toIso8601String());

            foreach ($questions as $question) {
                $answer = $response->answers->firstWhere('question_id', $question->id);
                $value = $answer?->value;
                $sheet->getCell(Coordinate::stringFromColumnIndex($col) . $rowNum)->setValue(
                    is_array($value) ? implode('; ', $value) : ($value ?? ''),
                );
                $col++;
            }

            $rowNum++;
        }

        // Autosize columns
        foreach (range(1, count($headers)) as $colIdx) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($colIdx))->setAutoSize(true);
        }

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $survey->slug . '-results.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
