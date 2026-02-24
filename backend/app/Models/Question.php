<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Single question
class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'survey_id',
        'type',
        'text',
        'description',
        'banner_image',
        'options',
        'required',
        'correct_answer',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'options'  => 'array',
            'required' => 'boolean',
            'position' => 'integer',
        ];
    }

    // Question belongs to
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    // Submitted answers
    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }
}
