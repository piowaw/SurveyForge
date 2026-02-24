<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for the Auth controller: register, login, logout,
 * profile management (get, update, change password, delete).
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    /* ──────────── Registration ──────────── */

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
    }

    public function test_register_validation_fails_without_required_fields(): void
    {
        $response = $this->postJson('/api/auth/register', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        $this->createUser(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Another',
            'email'                 => 'taken@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    /* ──────────── Login ──────────── */

    public function test_user_can_login(): void
    {
        $this->createUser([
            'email'    => 'login@example.com',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'login@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()
                 ->assertJsonStructure(['user', 'token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->createUser([
            'email'    => 'wrong@example.com',
            'password' => bcrypt('correct'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'wrong@example.com',
            'password' => 'incorrect',
        ]);

        $response->assertStatus(401);
    }

    /* ──────────── Logout ──────────── */

    public function test_user_can_logout(): void
    {
        $user  = $this->createUser();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/auth/logout');

        $response->assertOk();
    }

    /* ──────────── Profile ──────────── */

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->getJson('/api/me');

        $response->assertOk()
                 ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }

    public function test_user_can_update_profile(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->putJson('/api/me', [
            'name'  => 'Updated Name',
            'email' => 'updated@example.com',
        ]);

        $response->assertOk()
                 ->assertJsonFragment(['name' => 'Updated Name']);
    }

    public function test_user_can_change_password(): void
    {
        $user = $this->createUser(['password' => bcrypt('oldpass123')]);

        $response = $this->actingAs($user)->putJson('/api/me/password', [
            'current_password'      => 'oldpass123',
            'password'              => 'newpass456',
            'password_confirmation' => 'newpass456',
        ]);

        $response->assertOk();
    }

    public function test_change_password_fails_with_wrong_current(): void
    {
        $user = $this->createUser(['password' => bcrypt('correct')]);

        $response = $this->actingAs($user)->putJson('/api/me/password', [
            'current_password'      => 'wrong',
            'password'              => 'newpass456',
            'password_confirmation' => 'newpass456',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_delete_account(): void
    {
        $user = $this->createUser(['password' => bcrypt('deleteMe')]);

        $response = $this->actingAs($user)->deleteJson('/api/me', [
            'password' => 'deleteMe',
        ]);

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }
}
