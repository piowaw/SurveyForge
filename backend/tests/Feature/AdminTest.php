<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for AdminController: user management, survey management.
 * All routes are behind the admin middleware.
 */
class AdminTest extends TestCase
{
    use RefreshDatabase;

    /* ──────────── Access control ──────────── */

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $user = $this->createUser(['is_admin' => false]);

        $this->actingAs($user)->getJson('/api/admin/users')->assertStatus(403);
        $this->actingAs($user)->getJson('/api/admin/surveys')->assertStatus(403);
    }

    /* ──────────── Users ──────────── */

    public function test_admin_can_list_users(): void
    {
        $admin = $this->createUser(['is_admin' => true]);
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/users');

        $response->assertOk()
                 ->assertJsonCount(4); // 3 + admin
    }

    public function test_admin_can_update_user(): void
    {
        $admin  = $this->createUser(['is_admin' => true]);
        $target = $this->createUser(['name' => 'Old Name']);

        $response = $this->actingAs($admin)->putJson("/api/admin/users/{$target->id}", [
            'name' => 'New Name',
        ]);

        $response->assertOk()
                 ->assertJsonFragment(['name' => 'New Name']);
    }

    public function test_admin_can_delete_user(): void
    {
        $admin  = $this->createUser(['is_admin' => true]);
        $target = $this->createUser();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/users/{$target->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    /* ──────────── Surveys ──────────── */

    public function test_admin_can_list_all_surveys(): void
    {
        $admin = $this->createUser(['is_admin' => true]);
        $other = $this->createUser();
        Survey::factory()->count(2)->create(['owner_id' => $other->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/surveys');

        $response->assertOk()
                 ->assertJsonCount(2);
    }

    public function test_admin_can_delete_any_survey(): void
    {
        $admin  = $this->createUser(['is_admin' => true]);
        $other  = $this->createUser();
        $survey = Survey::factory()->create(['owner_id' => $other->id]);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/surveys/{$survey->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('surveys', ['id' => $survey->id]);
    }
}
