<?php

namespace Tests\Feature;

use App\Models\Survey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for CollaboratorController: add and remove collaborators.
 */
class CollaboratorTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_add_collaborator(): void
    {
        $owner       = $this->createUser();
        $collaborator = $this->createUser(['email' => 'collab@example.com']);
        $survey      = Survey::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/surveys/{$survey->id}/collaborators", [
            'email' => 'collab@example.com',
            'role'  => 'editor',
        ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['role' => 'editor']);
    }

    public function test_cannot_add_owner_as_collaborator(): void
    {
        $owner  = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/surveys/{$survey->id}/collaborators", [
            'email' => $owner->email,
            'role'  => 'viewer',
        ]);

        $response->assertStatus(422);
    }

    public function test_non_owner_cannot_add_collaborator(): void
    {
        $owner  = $this->createUser();
        $editor = $this->createUser();
        $target = $this->createUser(['email' => 'target@example.com']);
        $survey = Survey::factory()->create(['owner_id' => $owner->id]);
        $survey->collaborators()->attach($editor->id, ['role' => 'editor']);

        $response = $this->actingAs($editor)->postJson("/api/surveys/{$survey->id}/collaborators", [
            'email' => 'target@example.com',
            'role'  => 'viewer',
        ]);

        $response->assertStatus(403);
    }

    public function test_owner_can_remove_collaborator(): void
    {
        $owner       = $this->createUser();
        $collaborator = $this->createUser();
        $survey      = Survey::factory()->create(['owner_id' => $owner->id]);
        $survey->collaborators()->attach($collaborator->id, ['role' => 'editor']);

        $response = $this->actingAs($owner)->deleteJson("/api/surveys/{$survey->id}/collaborators/{$collaborator->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('collaborators', [
            'survey_id' => $survey->id,
            'user_id'   => $collaborator->id,
        ]);
    }
}
