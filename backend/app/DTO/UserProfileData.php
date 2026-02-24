<?php

namespace App\DTO;

// User profile updates
final readonly class UserProfileData
{
    public function __construct(
        public ?string $name = null,
        public ?string $email = null,
        public ?bool $is_admin = null,
        public ?string $password = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'] ?? null,
            email: $data['email'] ?? null,
            is_admin: $data['is_admin'] ?? null,
            password: $data['password'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter(get_object_vars($this), fn ($v) => $v !== null);
    }
}
