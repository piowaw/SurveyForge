<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validates account deletion
class DeleteAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'password' => ['required', 'string'],
        ];
    }
}
