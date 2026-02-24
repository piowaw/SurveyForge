<?php

namespace App\DTO;

// Creating and updating surveys
final readonly class SurveyData
{
    public function __construct(
        public string $title,
        public ?string $description = null,
        public ?bool $is_public = null,
        public ?bool $is_accepting_responses = null,
        public ?string $opens_at = null,
        public ?string $closes_at = null,
        public ?bool $require_name = null,
        public ?bool $require_email = null,
        public ?string $access_password = null,
        public ?int $time_limit = null,
        public ?string $theme_color = null,
        public ?string $banner_image = null,
        public ?bool $show_responses_after_submit = null,
        public ?bool $show_correct_after_submit = null,
        public ?bool $one_question_per_page = null,
        public ?bool $prevent_going_back = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            title: $data['title'],
            description: $data['description'] ?? null,
            is_public: $data['is_public'] ?? null,
            is_accepting_responses: $data['is_accepting_responses'] ?? null,
            opens_at: $data['opens_at'] ?? null,
            closes_at: $data['closes_at'] ?? null,
            require_name: $data['require_name'] ?? null,
            require_email: $data['require_email'] ?? null,
            access_password: $data['access_password'] ?? null,
            time_limit: $data['time_limit'] ?? null,
            theme_color: $data['theme_color'] ?? null,
            banner_image: $data['banner_image'] ?? null,
            show_responses_after_submit: $data['show_responses_after_submit'] ?? null,
            show_correct_after_submit: $data['show_correct_after_submit'] ?? null,
            one_question_per_page: $data['one_question_per_page'] ?? null,
            prevent_going_back: $data['prevent_going_back'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter(get_object_vars($this), fn ($v) => $v !== null);
    }
}
