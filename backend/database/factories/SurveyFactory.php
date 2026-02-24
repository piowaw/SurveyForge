<?php

namespace Database\Factories;

use App\Models\Survey;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for the Survey model used in automated tests.
 *
 * @extends Factory<Survey>
 */
class SurveyFactory extends Factory
{
    protected $model = Survey::class;

    public function definition(): array
    {
        return [
            'owner_id'    => User::factory(),
            'title'       => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status'      => 'draft',
            'is_public'   => false,
        ];
    }

    /** Set the survey as published with a slug. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status'    => 'published',
            'is_public' => true,
            'slug'      => fake()->unique()->slug(2),
        ]);
    }
}
