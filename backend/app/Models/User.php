<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// User model
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function ownedSurveys(): HasMany
    {
        return $this->hasMany(Survey::class, 'owner_id');
    }

    public function collaborations(): BelongsToMany
    {
        return $this->belongsToMany(Survey::class, 'collaborators')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function favoriteSurveys(): BelongsToMany
    {
        return $this->belongsToMany(Survey::class, 'survey_favorites')
            ->withTimestamps();
    }
}
