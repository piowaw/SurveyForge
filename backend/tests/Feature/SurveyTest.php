<?php

namespace Tests\Feature;

use App\Models\Survey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for SurveyController: CRUD, publish, favourite, duplicate.
 */
class SurveyTest extends TestCase
{
    use RefreshDatabase;

    /* ──────────── Index ──────────── */

    public function test_user_can_list_own_surveys(): void
    {
        $user = $this->createUser();
        Survey::factory()->count(3)->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/surveys');

        $response->assertOk()
                 ->assertJsonCount(3);
    }

    public function test_listing_includes_collaborative_surveys(): void
    {
        $owner        = $this->createUser();
        $collaborator = $this->createUser();
        $survey       = Survey::factory()->create(['owner_id' => $owner->id]);
        $survey->collaborators()->attach($collaborator->id, ['role' => 'editor']);

        $response = $this->actingAs($collaborator)->getJson('/api/surveys');

        $response->assertOk()
                 ->assertJsonCount(1);
    }

    /* ──────────── Create ──────────── */

    public function test_user_can_create_survey(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->postJson('/api/surveys', [
            'title'       => 'New Survey',
            'description' => 'A test survey.',
        ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['title' => 'New Survey']);

        $this->assertDatabaseHas('surveys', ['title' => 'New Survey', 'owner_id' => $user->id]);
    }

    public function test_create_survey_requires_title(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->postJson('/api/surveys', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['title']);
    }

    /* ──────────── Show ──────────── */

    public function test_owner_can_view_survey(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->getJson("/api/surveys/{$survey->id}");

        $response->assertOk()
                 ->assertJsonFragment(['id' => $survey->id]);
    }

    public function test_non_collaborator_cannot_view_survey(): void
    {
        $owner   = $this->createUser();
        $other   = $this->createUser();
        $survey  = Survey::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($other)->getJson("/api/surveys/{$survey->id}");

        $response->assertStatus(403);
    }

    /* ──────────── Update ──────────── */

    public function test_owner_can_update_survey(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->putJson("/api/surveys/{$survey->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertOk()
                 ->assertJsonFragment(['title' => 'Updated Title']);
    }

    public function test_viewer_cannot_update_survey(): void
    {
        $owner  = $this->createUser();
        $viewer = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $owner->id]);
        $survey->collaborators()->attach($viewer->id, ['role' => 'viewer']);

        $response = $this->actingAs($viewer)->putJson("/api/surveys/{$survey->id}", [
            'title' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    /* ──────────── Delete ──────────── */

    public function test_owner_can_delete_survey(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->deleteJson("/api/surveys/{$survey->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('surveys', ['id' => $survey->id]);
    }

    public function test_non_owner_cannot_delete_survey(): void
    {
        $owner = $this->createUser();
        $other = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $owner->id]);
        $survey->collaborators()->attach($other->id, ['role' => 'editor']);

        $response = $this->actingAs($other)->deleteJson("/api/surveys/{$survey->id}");

        $response->assertStatus(403);
    }

    /* ──────────── Publish ──────────── */

    public function test_owner_can_publish_survey(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $user->id, 'status' => 'draft']);

        $response = $this->actingAs($user)->postJson("/api/surveys/{$survey->id}/publish");

        $response->assertOk()
                 ->assertJsonFragment(['status' => 'published']);
    }

    /* ──────────── Favourite ──────────── */

    public function test_user_can_toggle_favourite(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/surveys/{$survey->id}/favorite");

        $response->assertOk()
                 ->assertJsonFragment(['is_favorited' => true]);

        // Toggle off
        $response2 = $this->actingAs($user)->postJson("/api/surveys/{$survey->id}/favorite");

        $response2->assertOk()
                  ->assertJsonFragment(['is_favorited' => false]);
    }

    /* ──────────── Duplicate ──────────── */

    public function test_owner_can_duplicate_survey(): void
    {
        $user   = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $user->id, 'title' => 'Original']);

        $response = $this->actingAs($user)->postJson("/api/surveys/{$survey->id}/duplicate");

        $response->assertStatus(201)
                 ->assertJsonFragment(['title' => 'Original (Copy)']);
    }
}
