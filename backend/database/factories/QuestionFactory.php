<?php

namespace Database\Factories;

use App\Models\Question;
use App\Models\Survey;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for the Question model used in automated tests.
 *
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        return [
            'survey_id' => Survey::factory(),
            'type'      => 'SHORT_TEXT',
            'text'      => fake()->sentence(),
            'options'   => null,
            'required'  => false,
            'position'  => 0,
        ];
    }

    /** Create a single-choice question with options. */
    public function singleChoice(): static
    {
        return $this->state(fn () => [
            'type'    => 'SINGLE_CHOICE',
            'options' => ['Option A', 'Option B', 'Option C'],
        ]);
    }
}
