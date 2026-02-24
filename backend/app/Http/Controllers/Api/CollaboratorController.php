<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddCollaboratorRequest;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Manages survey collaboration
class CollaboratorController extends Controller
{
    // Add
    public function store(AddCollaboratorRequest $request, Survey $survey): JsonResponse
    {
        $this->authorize('manageCollaborators', $survey);

        $user = User::where('email', $request->validated('email'))->first();

        if (! $user) {
            return response()->json([
                'message' => 'User not found.',
                'errors' => ['email' => ['No user found with this email address.']],
            ], 404);
        }

        if ($user->id === $survey->owner_id) {
            return response()->json([
                'message' => 'Cannot add owner as collaborator.',
                'errors' => ['email' => ['The survey owner cannot be added as a collaborator.']],
            ], 422);
        }

        $survey->collaborators()->syncWithoutDetaching([
            $user->id => ['role' => $request->validated('role')],
        ]);

        return response()->json(
            $survey->load('collaborators:id,name,email'),
            201,
        );
    }

    // Remove
    public function destroy(Request $request, Survey $survey, int $userId): JsonResponse
    {
        $this->authorize('manageCollaborators', $survey);

        $survey->collaborators()->detach($userId);

        return response()->json(['message' => 'Collaborator removed.']);
    }
}
