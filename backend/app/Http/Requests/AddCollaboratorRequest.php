<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddCollaboratorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'role' => ['required', 'string', 'in:editor,viewer'],
        ];
    }
}
