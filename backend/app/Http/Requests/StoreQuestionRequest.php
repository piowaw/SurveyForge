<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(['SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'NUMBER', 'FILE', 'RANKING', 'CODE'])],
            'text' => ['required', 'string', 'max:1000'],
            'description' => ['nullable', 'string', 'max:2000'],
            'banner_image' => ['nullable', 'string', 'max:2097152'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:500'],
            'required' => ['sometimes', 'boolean'],
            'correct_answer' => ['nullable', 'string', 'max:5000'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $type = $this->input('type');
            if (in_array($type, ['SINGLE_CHOICE', 'MULTI_CHOICE', 'RANKING']) && empty($this->input('options'))) {
                $validator->errors()->add('options', 'Choice/ranking questions require at least one option.');
            }
        });
    }
}
