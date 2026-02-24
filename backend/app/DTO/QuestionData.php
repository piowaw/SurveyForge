<?php

namespace App\DTO;

// Creating and updating questions
final readonly class QuestionData
{
    public function __construct(
        public string $type,
        public string $text,
        public ?string $description = null,
        public ?string $banner_image = null,
        public ?array $options = null,
        public bool $required = false,
        public ?string $correct_answer = null,
        public ?int $position = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            type: $data['type'],
            text: $data['text'],
            description: $data['description'] ?? null,
            banner_image: $data['banner_image'] ?? null,
            options: $data['options'] ?? null,
            required: $data['required'] ?? false,
            correct_answer: $data['correct_answer'] ?? null,
            position: $data['position'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter(get_object_vars($this), fn ($v) => $v !== null);
    }
}
