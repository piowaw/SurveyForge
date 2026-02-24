<?php

namespace App\Enums;

// Supported question types for the survey
enum QuestionType: string
{
    case SHORT_TEXT    = 'SHORT_TEXT';
    case LONG_TEXT     = 'LONG_TEXT';
    case SINGLE_CHOICE = 'SINGLE_CHOICE';
    case MULTI_CHOICE  = 'MULTI_CHOICE';
    case NUMBER        = 'NUMBER';
    case FILE          = 'FILE';
    case RANKING       = 'RANKING';
    case CODE          = 'CODE';

    // Check if this question type requires predefined options
    public function requiresOptions(): bool
    {
        return in_array($this, [
            self::SINGLE_CHOICE,
            self::MULTI_CHOICE,
            self::RANKING,
        ]);
    }

    public function isChoiceBased(): bool
    {
        return $this->requiresOptions();
    }

    // Get all valid type values
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
