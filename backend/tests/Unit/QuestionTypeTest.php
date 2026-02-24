<?php

namespace Tests\Unit;

use App\Enums\QuestionType;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the QuestionType backed enum.
 */
class QuestionTypeTest extends TestCase
{
    public function test_all_eight_types_exist(): void
    {
        $this->assertCount(8, QuestionType::cases());
    }

    public function test_values_returns_string_array(): void
    {
        $values = QuestionType::values();

        $this->assertContains('SHORT_TEXT', $values);
        $this->assertContains('LONG_TEXT', $values);
        $this->assertContains('SINGLE_CHOICE', $values);
        $this->assertContains('MULTI_CHOICE', $values);
        $this->assertContains('NUMBER', $values);
        $this->assertContains('FILE', $values);
        $this->assertContains('RANKING', $values);
        $this->assertContains('CODE', $values);
    }

    public function test_requires_options_for_choice_types(): void
    {
        $this->assertTrue(QuestionType::SINGLE_CHOICE->requiresOptions());
        $this->assertTrue(QuestionType::MULTI_CHOICE->requiresOptions());
        $this->assertTrue(QuestionType::RANKING->requiresOptions());
    }

    public function test_does_not_require_options_for_text_types(): void
    {
        $this->assertFalse(QuestionType::SHORT_TEXT->requiresOptions());
        $this->assertFalse(QuestionType::LONG_TEXT->requiresOptions());
        $this->assertFalse(QuestionType::NUMBER->requiresOptions());
        $this->assertFalse(QuestionType::FILE->requiresOptions());
        $this->assertFalse(QuestionType::CODE->requiresOptions());
    }

    public function test_is_choice_based(): void
    {
        $this->assertTrue(QuestionType::SINGLE_CHOICE->isChoiceBased());
        $this->assertTrue(QuestionType::MULTI_CHOICE->isChoiceBased());
        $this->assertFalse(QuestionType::SHORT_TEXT->isChoiceBased());
    }

    public function test_try_from_returns_null_for_invalid_type(): void
    {
        $this->assertNull(QuestionType::tryFrom('INVALID_TYPE'));
    }
}
