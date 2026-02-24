<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Survey collaboration
class Collaborator extends Model
{
    protected $fillable = [
        'survey_id',
        'user_id',
        'role',
    ];

    // Collaborator belongs to
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    // User who is a collaborator
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
