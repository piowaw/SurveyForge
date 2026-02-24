<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Single completed response
class Response extends Model
{
    use HasFactory;

    protected $fillable = [
        'survey_id',
        'respondent_name',
        'respondent_email',
    ];

    // Survey belongs to
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    // Answers within this response
    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }
}
