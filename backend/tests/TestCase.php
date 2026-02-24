<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** @param array<string, mixed> $attributes */
    protected function createUser(array $attributes = []): User
    {
        return User::factory()->create($attributes);
    }
}
