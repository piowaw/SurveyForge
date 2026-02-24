<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

// Survey model
class Survey extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'title',
        'description',
        'slug',
        'status',
        'is_public',
        'is_accepting_responses',
        'opens_at',
        'closes_at',
        'require_name',
        'require_email',
        'access_password',
        'time_limit',
        'theme_color',
        'banner_image',
        'show_responses_after_submit',
        'show_correct_after_submit',
        'one_question_per_page',
        'prevent_going_back',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'is_accepting_responses' => 'boolean',
            'opens_at' => 'datetime',
            'closes_at' => 'datetime',
            'require_name' => 'boolean',
            'require_email' => 'boolean',
            'time_limit' => 'integer',
            'show_responses_after_submit' => 'boolean',
            'show_correct_after_submit' => 'boolean',
            'one_question_per_page' => 'boolean',
            'prevent_going_back' => 'boolean',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('position');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(Response::class);
    }

    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'collaborators')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'survey_favorites')
            ->withTimestamps();
    }

    // Check if user has a specific role (Survey)
    public function userHasRole(int $userId, string $role): bool
    {
        if ($role === 'owner') {
            return $this->owner_id === $userId;
        }

        return $this->collaborators()
            ->where('user_id', $userId)
            ->where('role', $role)
            ->exists();
    }

    // Check if user can edit
    public function userCanEdit(int $userId): bool
    {
        return $this->owner_id === $userId
            || $this->collaborators()->where('user_id', $userId)->where('role', 'editor')->exists();
    }

    // Check if user can view results
    public function userCanView(int $userId): bool
    {
        return $this->owner_id === $userId
            || $this->collaborators()->where('user_id', $userId)->exists();
    }
}
