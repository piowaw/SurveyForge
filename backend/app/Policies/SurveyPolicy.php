<?php

namespace App\Policies;

use App\Models\Survey;
use App\Models\User;

// Authorization policy for survey
class SurveyPolicy
{
    // View
    public function view(User $user, Survey $survey): bool
    {
        return $survey->userCanView($user->id);
    }

    // Update
    public function update(User $user, Survey $survey): bool
    {
        return $survey->userCanEdit($user->id);
    }

    // Delete
    public function delete(User $user, Survey $survey): bool
    {
        return $survey->owner_id === $user->id;
    }

    // Manage collaborators
    public function manageCollaborators(User $user, Survey $survey): bool
    {
        return $survey->owner_id === $user->id;
    }

    // View results
    public function viewResults(User $user, Survey $survey): bool
    {
        return $survey->userCanView($user->id);
    }
}
