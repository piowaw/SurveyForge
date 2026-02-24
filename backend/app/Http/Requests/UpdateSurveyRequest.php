<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSurveyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_public' => ['sometimes', 'boolean'],
            'is_accepting_responses' => ['sometimes', 'boolean'],
            'opens_at' => ['nullable', 'date'],
            'closes_at' => ['nullable', 'date', 'after_or_equal:opens_at'],
            'require_name' => ['sometimes', 'boolean'],
            'require_email' => ['sometimes', 'boolean'],
            'access_password' => ['nullable', 'string', 'max:255'],
            'time_limit' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'theme_color' => ['nullable', 'string', 'max:20'],
            'banner_image' => ['nullable', 'string', 'max:2097152'],
            'show_responses_after_submit' => ['sometimes', 'boolean'],
            'show_correct_after_submit' => ['sometimes', 'boolean'],
            'one_question_per_page' => ['sometimes', 'boolean'],
            'prevent_going_back' => ['sometimes', 'boolean'],
        ];
    }
}
