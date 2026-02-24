<?php

namespace App\Services;

use App\Models\Collaborator;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

// Logic for survey management
class SurveyService
{
    // List all surveys
    public function listForUser(User $user): Collection
    {
        $owned = $user->ownedSurveys()->with(['questions', 'owner:id,name,email'])->get();
        $collaborated = $user->collaborations()->with(['questions', 'owner:id,name,email'])->get();
        $favoriteIds = $user->favoriteSurveys()->pluck('surveys.id')->toArray();

        $surveys = $owned->merge($collaborated)->unique('id')->sortByDesc('updated_at')->values();

        return $surveys->map(function ($survey) use ($user, $favoriteIds) {
            $survey->is_favorited = in_array($survey->id, $favoriteIds);

            if ($survey->owner_id === $user->id) {
                $survey->user_role = 'owner';
            } else {
                $collab = Collaborator::where('survey_id', $survey->id)
                    ->where('user_id', $user->id)
                    ->first();
                $survey->user_role = $collab ? $collab->role : 'viewer';
            }

            return $survey;
        });
    }

    // Create a new survey in draft status
    public function create(User $user, array $data): Survey
    {
        return $user->ownedSurveys()->create([
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'status'      => 'draft',
            'is_public'   => false,
        ]);
    }

    // Update survey metadata with validated data
    public function update(Survey $survey, array $data): Survey
    {
        $survey->update($data);

        return $survey->fresh();
    }

    // Duplicate a survey
    public function duplicate(Survey $survey, User $user): Survey
    {
        $newSurvey = $survey->replicate([
            'slug', 'status', 'is_public', 'is_accepting_responses',
        ]);
        $newSurvey->title = $survey->title . ' (Copy)';
        $newSurvey->slug = null;
        $newSurvey->status = 'draft';
        $newSurvey->is_public = false;
        $newSurvey->is_accepting_responses = true;
        $newSurvey->owner_id = $user->id;
        $newSurvey->save();

        foreach ($survey->questions as $question) {
            $newQuestion = $question->replicate();
            $newQuestion->survey_id = $newSurvey->id;
            $newQuestion->save();
        }

        return $newSurvey->load('questions');
    }

    // Publish a survey
    public function publish(Survey $survey): Survey
    {
        if (! $survey->slug) {
            $survey->slug = $this->generateUniqueSlug();
        }

        $survey->status = 'published';
        $survey->is_public = true;
        $survey->save();

        return $survey->fresh();
    }

    // Generate a unique slug
    private function generateUniqueSlug(): string
    {
        do {
            $slug = Str::random(12);
        } while (Survey::where('slug', $slug)->exists());

        return $slug;
    }
}
