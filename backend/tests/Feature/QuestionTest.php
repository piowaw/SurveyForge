<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Survey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for QuestionController: create, update, delete, reorder.
 */
class QuestionTest extends TestCase
{
    use RefreshDatabase;

    /* ──────────── Create ──────────── */

    public function test_owner_can_add_question(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/surveys/{$survey->id}/questions", [
            'type'     => 'SHORT_TEXT',
            'text'     => 'What is your name?',
            'required' => true,
        ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['type' => 'SHORT_TEXT']);
    }

    public function test_editor_can_add_question(): void
    {
        $owner  = $this->createUser();
        $editor = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $owner->id]);
        $survey->collaborators()->attach($editor->id, ['role' => 'editor']);

        $response = $this->actingAs($editor)->postJson("/api/surveys/{$survey->id}/questions", [
            'type' => 'SINGLE_CHOICE',
            'text' => 'Pick one',
            'options' => ['A', 'B', 'C'],
        ]);

        $response->assertStatus(201);
    }

    public function test_viewer_cannot_add_question(): void
    {
        $owner  = $this->createUser();
        $viewer = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $owner->id]);
        $survey->collaborators()->attach($viewer->id, ['role' => 'viewer']);

        $response = $this->actingAs($viewer)->postJson("/api/surveys/{$survey->id}/questions", [
            'type' => 'SHORT_TEXT',
            'text' => 'Nope',
        ]);

        $response->assertStatus(403);
    }

    public function test_choice_question_requires_options(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/surveys/{$survey->id}/questions", [
            'type' => 'SINGLE_CHOICE',
            'text' => 'Missing options',
        ]);

        $response->assertStatus(422);
    }

    /* ──────────── Update ──────────── */

    public function test_owner_can_update_question(): void
    {
        $user     = $this->createUser();
        $survey   = Survey::factory()->create(['owner_id' => $user->id]);
        $question = Question::factory()->create(['survey_id' => $survey->id, 'type' => 'SHORT_TEXT', 'text' => 'Old text']);

        $response = $this->actingAs($user)->putJson("/api/questions/{$question->id}", [
            'text' => 'New text',
        ]);

        $response->assertOk()
                 ->assertJsonFragment(['text' => 'New text']);
    }

    /* ──────────── Delete ──────────── */

    public function test_owner_can_delete_question(): void
    {
        $user     = $this->createUser();
        $survey   = Survey::factory()->create(['owner_id' => $user->id]);
        $question = Question::factory()->create(['survey_id' => $survey->id]);

        $response = $this->actingAs($user)->deleteJson("/api/questions/{$question->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('questions', ['id' => $question->id]);
    }

    /* ──────────── Reorder ──────────── */

    public function test_owner_can_reorder_questions(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $user->id]);
        $q1     = Question::factory()->create(['survey_id' => $survey->id, 'position' => 0]);
        $q2     = Question::factory()->create(['survey_id' => $survey->id, 'position' => 1]);

        $response = $this->actingAs($user)->postJson("/api/surveys/{$survey->id}/questions/reorder", [
            'order' => [$q2->id, $q1->id],
        ]);

        $response->assertOk();
        $this->assertEquals(1, $q1->fresh()->position);
        $this->assertEquals(0, $q2->fresh()->position);
    }
}
