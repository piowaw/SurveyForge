<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Survey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Feature tests for PublicSurveyController: view published survey by slug
 * and submit responses.
 */
class PublicSurveyTest extends TestCase
{
    use RefreshDatabase;

    private function publishedSurveyWithQuestion(): array
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create([
            'owner_id'  => $user->id,
            'status'    => 'published',
            'is_public' => true,
            'slug'      => Str::random(12),
        ]);
        $question = Question::factory()->create([
            'survey_id' => $survey->id,
            'type'      => 'SHORT_TEXT',
            'text'      => 'Your name?',
            'required'  => true,
        ]);

        return [$survey, $question];
    }

    public function test_can_view_published_survey_by_slug(): void
    {
        [$survey] = $this->publishedSurveyWithQuestion();

        $response = $this->getJson("/api/public/surveys/{$survey->slug}");

        $response->assertOk()
                 ->assertJsonFragment(['title' => $survey->title]);
    }

    public function test_cannot_view_draft_survey(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create([
            'owner_id' => $user->id,
            'status'   => 'draft',
            'slug'     => Str::random(12),
        ]);

        $response = $this->getJson("/api/public/surveys/{$survey->slug}");

        $response->assertStatus(404);
    }

    public function test_can_submit_response(): void
    {
        [$survey, $question] = $this->publishedSurveyWithQuestion();

        $response = $this->postJson("/api/public/surveys/{$survey->slug}/responses", [
            'answers' => [
                ['question_id' => $question->id, 'value' => 'John Doe'],
            ],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('responses', ['survey_id' => $survey->id]);
    }

    public function test_submit_fails_without_required_answers(): void
    {
        [$survey] = $this->publishedSurveyWithQuestion();

        $response = $this->postJson("/api/public/surveys/{$survey->slug}/responses", [
            'answers' => [],
        ]);

        $response->assertStatus(422);
    }

    public function test_password_protected_survey_requires_password(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create([
            'owner_id'        => $user->id,
            'status'          => 'published',
            'is_public'       => true,
            'slug'            => Str::random(12),
            'access_password' => 'secretpass',
        ]);
        $question = Question::factory()->create([
            'survey_id' => $survey->id,
            'type'      => 'SHORT_TEXT',
            'text'      => 'Name?',
            'required'  => false,
        ]);

        // Without password
        $response = $this->postJson("/api/public/surveys/{$survey->slug}/responses", [
            'answers' => [
                ['question_id' => $question->id, 'value' => 'Test'],
            ],
        ]);

        $response->assertStatus(403);

        // With correct password
        $response2 = $this->postJson("/api/public/surveys/{$survey->slug}/responses", [
            'password' => 'secretpass',
            'answers'  => [
                ['question_id' => $question->id, 'value' => 'Test'],
            ],
        ]);

        $response2->assertStatus(201);
    }
}
