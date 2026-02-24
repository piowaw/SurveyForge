<?php

namespace Tests\Feature;

use App\Models\Answer;
use App\Models\Question;
use App\Models\Response;
use App\Models\Survey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for ResultsController: aggregated results, individual
 * responses listing, response deletion, and export.
 */
class ResultsTest extends TestCase
{
    use RefreshDatabase;

    private function surveyWithResponses(): array
    {
        $user     = $this->createUser();
        $survey   = Survey::factory()->create(['owner_id' => $user->id, 'status' => 'published']);
        $question = Question::factory()->create([
            'survey_id' => $survey->id,
            'type'      => 'SINGLE_CHOICE',
            'text'      => 'Rating?',
            'options'   => ['Good', 'Bad'],
        ]);

        for ($i = 0; $i < 3; $i++) {
            $resp = Response::create(['survey_id' => $survey->id]);
            Answer::create([
                'response_id' => $resp->id,
                'question_id' => $question->id,
                'value'       => $i < 2 ? 'Good' : 'Bad',
            ]);
        }

        return [$user, $survey, $question];
    }

    public function test_owner_can_view_results(): void
    {
        [$user, $survey] = $this->surveyWithResponses();

        $response = $this->actingAs($user)->getJson("/api/surveys/{$survey->id}/results");

        $response->assertOk()
                 ->assertJsonPath('total_responses', 3);
    }

    public function test_owner_can_list_responses(): void
    {
        [$user, $survey] = $this->surveyWithResponses();

        $response = $this->actingAs($user)->getJson("/api/surveys/{$survey->id}/responses");

        $response->assertOk()
                 ->assertJsonCount(3);
    }

    public function test_owner_can_delete_response(): void
    {
        [$user, $survey] = $this->surveyWithResponses();
        $respId = Response::where('survey_id', $survey->id)->first()->id;

        $response = $this->actingAs($user)->deleteJson("/api/surveys/{$survey->id}/responses/{$respId}");

        $response->assertOk();
        $this->assertDatabaseMissing('responses', ['id' => $respId]);
    }

    public function test_non_collaborator_cannot_view_results(): void
    {
        [$_, $survey] = $this->surveyWithResponses();
        $other = $this->createUser();

        $response = $this->actingAs($other)->getJson("/api/surveys/{$survey->id}/results");

        $response->assertStatus(403);
    }

    public function test_export_returns_downloadable_file(): void
    {
        [$user, $survey] = $this->surveyWithResponses();

        $response = $this->actingAs($user)->get("/api/surveys/{$survey->id}/export?format=csv");

        $response->assertOk()
                 ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }
}
