<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminUpdateUserRequest;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

// Admin panel, managing users and surveys
// All routes are protected by the AdminMiddleware
class AdminController extends Controller
{
    // Users
    // List all users
    public function users(): JsonResponse
    {
        $users = User::withCount('ownedSurveys')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (User $u) => [
                'id'                  => $u->id,
                'name'                => $u->name,
                'email'               => $u->email,
                'is_admin'            => $u->is_admin,
                'owned_surveys_count' => $u->owned_surveys_count,
                'created_at'          => $u->created_at,
            ]);

        return response()->json($users);
    }

    // Update a users details
    public function updateUser(AdminUpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'is_admin'   => $user->is_admin,
            'created_at' => $user->created_at,
        ]);
    }

    // Delete a user
    public function deleteUser(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot delete your own account from the admin panel.', //Admins cant delete themselves via this endpoint
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    // Surveys
    //List all surveys in the system with owner and counts
    public function surveys(): JsonResponse
    {
        $surveys = Survey::with('owner:id,name,email')
            ->withCount(['questions', 'responses'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($surveys);
    }

    //Delete any survey (Admin option only)
    public function deleteSurvey(Survey $survey): JsonResponse
    {
        $survey->delete();

        return response()->json(['message' => 'Survey deleted.']);
    }
}
