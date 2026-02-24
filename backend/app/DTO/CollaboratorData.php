<?php

namespace App\DTO;

// Adding collaborators to a survey
final readonly class CollaboratorData
{
    public function __construct(
        public string $email,
        public string $role,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'],
            role: $data['role'],
        );
    }
}
