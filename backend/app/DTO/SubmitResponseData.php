<?php

namespace App\DTO;

// Survey response submissions
final readonly class SubmitResponseData
{
    public function __construct(
        public array $answers,
        public ?string $password = null,
        public ?string $respondent_name = null,
        public ?string $respondent_email = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            answers: $data['answers'],
            password: $data['password'] ?? null,
            respondent_name: $data['respondent_name'] ?? null,
            respondent_email: $data['respondent_email'] ?? null,
        );
    }
}
