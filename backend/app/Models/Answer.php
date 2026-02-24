<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Single answer
class Answer extends Model
{
    use HasFactory;

    protected $fillable = [
        'response_id',
        'question_id',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    // Answer belongs to
    public function response(): BelongsTo
    {
        return $this->belongsTo(Response::class);
    }

    // Answer belongs to
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
