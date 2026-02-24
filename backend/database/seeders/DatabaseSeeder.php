<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Survey;
use App\Models\Question;
use App\Models\Response;
use App\Models\Answer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds the database with comprehensive demo data for development and testing.
 *
 * Creates three users with varied survey ownership and collaboration roles.
 * All question types use the canonical frontend enum values:
 * SHORT_TEXT, LONG_TEXT, SINGLE_CHOICE, MULTI_CHOICE, NUMBER, FILE, RANKING, CODE.
 *
 * Demo accounts:
 *  - demo@surveyforge.local  (password: password) — admin, primary test account
 *  - alice@surveyforge.local  (password: password) — regular user
 *  - bob@surveyforge.local    (password: password) — regular user
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /* ──────────────── USERS ──────────────── */

        $demo = User::firstOrCreate(
            ['email' => 'demo@surveyforge.local'],
            ['name' => 'Demo User', 'password' => Hash::make('password'), 'is_admin' => true]
        );

        $alice = User::firstOrCreate(
            ['email' => 'alice@surveyforge.local'],
            ['name' => 'Alice Johnson', 'password' => Hash::make('password')]
        );

        $bob = User::firstOrCreate(
            ['email' => 'bob@surveyforge.local'],
            ['name' => 'Bob Smith', 'password' => Hash::make('password')]
        );

        /* ════════════════════════════════════════
         *  1. SURVEYS OWNED BY DEMO
         * ════════════════════════════════════════ */

        // --- 1a. Published survey with responses (demo owns, alice=editor, bob=viewer) ---
        $s1 = Survey::firstOrCreate(
            ['title' => 'Customer Satisfaction Survey', 'owner_id' => $demo->id],
            [
                'description' => 'We would love to hear your feedback about our service!',
                'slug'        => Str::random(12),
                'status'      => 'published',
                'is_public'   => true,
            ]
        );
        $s1->collaborators()->syncWithoutDetaching([
            $alice->id => ['role' => 'editor'],
            $bob->id   => ['role' => 'viewer'],
        ]);

        if ($s1->questions()->count() === 0) {
            $q1 = Question::create([
                'survey_id' => $s1->id, 'type' => 'SINGLE_CHOICE',
                'text' => 'How would you rate our service overall?',
                'options' => ['Excellent', 'Good', 'Average', 'Poor'],
                'required' => true, 'position' => 0,
            ]);
            $q2 = Question::create([
                'survey_id' => $s1->id, 'type' => 'MULTI_CHOICE',
                'text' => 'Which features do you use most?',
                'options' => ['Dashboard', 'Reports', 'API', 'Mobile App', 'Integrations'],
                'required' => true, 'position' => 1,
            ]);
            $q3 = Question::create([
                'survey_id' => $s1->id, 'type' => 'SHORT_TEXT',
                'text' => 'Any additional comments or suggestions?',
                'options' => null, 'required' => false, 'position' => 2,
            ]);

            $ratings  = ['Excellent', 'Good', 'Good', 'Average', 'Excellent'];
            $features = [
                ['Dashboard', 'Reports'],
                ['API', 'Integrations'],
                ['Dashboard', 'Mobile App', 'Reports'],
                ['Dashboard'],
                ['Dashboard', 'Reports', 'API', 'Integrations'],
            ];
            $comments = [
                'Great service, keep it up!',
                'Would love to see more integration options.',
                'The dashboard is very intuitive.',
                'Mobile app could use some improvements.',
                'Excellent support team!',
            ];

            for ($i = 0; $i < 5; $i++) {
                $resp = Response::create(['survey_id' => $s1->id]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $q1->id, 'value' => $ratings[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $q2->id, 'value' => $features[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $q3->id, 'value' => $comments[$i]]);
            }
        }

        // --- 1b. Draft survey (demo owns, no collaborators) ---
        Survey::firstOrCreate(
            ['title' => 'Product Feedback (Draft)', 'owner_id' => $demo->id],
            [
                'description' => 'Help us improve our product.',
                'status'      => 'draft',
                'is_public'   => false,
            ]
        );

        // --- 1c. Published survey with all 8 question types (demo owns) ---
        $s1c = Survey::firstOrCreate(
            ['title' => 'All Question Types Showcase', 'owner_id' => $demo->id],
            [
                'description' => 'A survey demonstrating every question type available.',
                'slug'        => Str::random(12),
                'status'      => 'published',
                'is_public'   => true,
            ]
        );

        if ($s1c->questions()->count() === 0) {
            Question::create(['survey_id' => $s1c->id, 'type' => 'SHORT_TEXT',     'text' => 'What is your full name?',                       'options' => null, 'required' => true,  'position' => 0]);
            Question::create(['survey_id' => $s1c->id, 'type' => 'LONG_TEXT',      'text' => 'Describe your experience with our platform.',    'options' => null, 'required' => false, 'position' => 1]);
            Question::create(['survey_id' => $s1c->id, 'type' => 'SINGLE_CHOICE',  'text' => 'How often do you use our product?',              'options' => ['Daily', 'Weekly', 'Monthly', 'Rarely'], 'required' => true, 'position' => 2]);
            Question::create(['survey_id' => $s1c->id, 'type' => 'MULTI_CHOICE',   'text' => 'Select all platforms you use.',                  'options' => ['Web', 'iOS', 'Android', 'Desktop'], 'required' => true, 'position' => 3]);
            Question::create(['survey_id' => $s1c->id, 'type' => 'NUMBER',         'text' => 'Rate your satisfaction (1-10).',                 'options' => null, 'required' => true,  'position' => 4]);
            Question::create(['survey_id' => $s1c->id, 'type' => 'RANKING',        'text' => 'Rank these features by importance.',             'options' => ['Speed', 'Reliability', 'UX Design', 'Support', 'Pricing'], 'required' => true, 'position' => 5]);
            Question::create(['survey_id' => $s1c->id, 'type' => 'CODE',           'text' => 'Paste a code snippet you find useful.',          'options' => null, 'required' => false, 'position' => 6]);
            Question::create(['survey_id' => $s1c->id, 'type' => 'NUMBER',         'text' => 'How many team members use the product?',         'options' => null, 'required' => false, 'position' => 7]);
        }

        /* ════════════════════════════════════════
         *  2. SURVEYS OWNED BY ALICE → shared with demo
         * ════════════════════════════════════════ */

        // --- 2a. Published survey — demo is EDITOR ---
        $s2a = Survey::firstOrCreate(
            ['title' => 'Employee Engagement Survey 2026', 'owner_id' => $alice->id],
            [
                'description' => 'Annual employee engagement & satisfaction questionnaire.',
                'slug'        => Str::random(12),
                'status'      => 'published',
                'is_public'   => true,
            ]
        );
        $s2a->collaborators()->syncWithoutDetaching([
            $demo->id => ['role' => 'editor'],
            $bob->id  => ['role' => 'viewer'],
        ]);

        if ($s2a->questions()->count() === 0) {
            $eq1 = Question::create([
                'survey_id' => $s2a->id, 'type' => 'SINGLE_CHOICE',
                'text' => 'How satisfied are you with your current role?',
                'options' => ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
                'required' => true, 'position' => 0,
            ]);
            $eq2 = Question::create([
                'survey_id' => $s2a->id, 'type' => 'NUMBER',
                'text' => 'On a scale of 1–10 how likely are you to recommend our company as a workplace?',
                'options' => null,
                'required' => true, 'position' => 1,
            ]);
            $eq3 = Question::create([
                'survey_id' => $s2a->id, 'type' => 'MULTI_CHOICE',
                'text' => 'Which benefits matter most to you?',
                'options' => ['Health Insurance', 'Remote Work', 'Stock Options', 'Education Budget', 'Gym Membership'],
                'required' => false, 'position' => 2,
            ]);
            $eq4 = Question::create([
                'survey_id' => $s2a->id, 'type' => 'LONG_TEXT',
                'text' => 'What could we improve to make this a better place to work?',
                'options' => null, 'required' => false, 'position' => 3,
            ]);

            // 8 demo responses
            $satisfactions = ['Very Satisfied', 'Satisfied', 'Satisfied', 'Neutral', 'Very Satisfied', 'Dissatisfied', 'Satisfied', 'Very Satisfied'];
            $nps           = ['9', '7', '8', '5', '10', '3', '7', '9'];
            $benefitSets   = [
                ['Remote Work', 'Health Insurance'],
                ['Stock Options', 'Education Budget'],
                ['Remote Work'],
                ['Health Insurance', 'Gym Membership'],
                ['Remote Work', 'Stock Options', 'Education Budget'],
                ['Health Insurance'],
                ['Remote Work', 'Education Budget'],
                ['Remote Work', 'Health Insurance', 'Stock Options'],
            ];
            $improvements = [
                'More flexible hours.', 'Better onboarding process.',
                'More team events.', 'Quieter open-plan areas.',
                'Everything is great!', 'Communication could improve.',
                'Invest in better tooling.', 'More career growth paths.',
            ];

            for ($i = 0; $i < 8; $i++) {
                $resp = Response::create(['survey_id' => $s2a->id]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $eq1->id, 'value' => $satisfactions[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $eq2->id, 'value' => $nps[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $eq3->id, 'value' => $benefitSets[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $eq4->id, 'value' => $improvements[$i]]);
            }
        }

        // --- 2b. Draft survey — demo is EDITOR ---
        $s2b = Survey::firstOrCreate(
            ['title' => 'Q3 Marketing Research', 'owner_id' => $alice->id],
            [
                'description' => 'Draft questions for the upcoming marketing campaign research.',
                'status'      => 'draft',
                'is_public'   => false,
            ]
        );
        $s2b->collaborators()->syncWithoutDetaching([
            $demo->id => ['role' => 'editor'],
        ]);

        if ($s2b->questions()->count() === 0) {
            Question::create(['survey_id' => $s2b->id, 'type' => 'SHORT_TEXT',     'text' => 'What brand comes to mind first when you think of project management?', 'options' => null, 'required' => true, 'position' => 0]);
            Question::create(['survey_id' => $s2b->id, 'type' => 'SINGLE_CHOICE',  'text' => 'How did you hear about us?', 'options' => ['Social Media', 'Google Search', 'Friend Referral', 'Blog Post', 'Conference'], 'required' => true, 'position' => 1]);
            Question::create(['survey_id' => $s2b->id, 'type' => 'SINGLE_CHOICE',  'text' => 'Which industry are you in?', 'options' => ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Other'], 'required' => false, 'position' => 2]);
        }

        // --- 2c. Published survey — demo is VIEWER ---
        $s2c = Survey::firstOrCreate(
            ['title' => 'UX Research – User Testing Results', 'owner_id' => $alice->id],
            [
                'description' => 'Collected user testing feedback for the new dashboard redesign.',
                'slug'        => Str::random(12),
                'status'      => 'published',
                'is_public'   => false,
            ]
        );
        $s2c->collaborators()->syncWithoutDetaching([
            $demo->id => ['role' => 'viewer'],
            $bob->id  => ['role' => 'editor'],
        ]);

        if ($s2c->questions()->count() === 0) {
            $uq1 = Question::create([
                'survey_id' => $s2c->id, 'type' => 'SINGLE_CHOICE',
                'text' => 'Was the new dashboard easy to navigate?',
                'options' => ['Yes, very easy', 'Somewhat easy', 'Neutral', 'Somewhat difficult', 'Very difficult'],
                'required' => true, 'position' => 0,
            ]);
            $uq2 = Question::create([
                'survey_id' => $s2c->id, 'type' => 'NUMBER',
                'text' => 'Rate the visual design of the new dashboard (1-5).',
                'options' => null,
                'required' => true, 'position' => 1,
            ]);
            $uq3 = Question::create([
                'survey_id' => $s2c->id, 'type' => 'MULTI_CHOICE',
                'text' => 'Which widgets did you find most useful?',
                'options' => ['Activity Feed', 'KPI Cards', 'Charts', 'Task List', 'Calendar'],
                'required' => false, 'position' => 2,
            ]);
            $uq4 = Question::create([
                'survey_id' => $s2c->id, 'type' => 'LONG_TEXT',
                'text' => 'Any other feedback on the redesign?',
                'options' => null, 'required' => false, 'position' => 3,
            ]);

            $navAnswers   = ['Yes, very easy', 'Somewhat easy', 'Yes, very easy', 'Neutral', 'Somewhat easy', 'Yes, very easy'];
            $designScores = ['4', '3', '5', '3', '4', '5'];
            $widgetSets   = [
                ['KPI Cards', 'Charts'],
                ['Activity Feed', 'Task List'],
                ['Charts', 'Calendar', 'KPI Cards'],
                ['Task List'],
                ['Activity Feed', 'Charts'],
                ['KPI Cards', 'Charts', 'Calendar'],
            ];
            $redesignFeedback = [
                'Love the new color scheme!',
                'Charts could load faster.',
                'Much better than the old version.',
                'Not sure about the sidebar placement.',
                'Calendar widget is a great addition.',
                'Perfect, ship it!',
            ];

            for ($i = 0; $i < 6; $i++) {
                $resp = Response::create(['survey_id' => $s2c->id]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $uq1->id, 'value' => $navAnswers[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $uq2->id, 'value' => $designScores[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $uq3->id, 'value' => $widgetSets[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $uq4->id, 'value' => $redesignFeedback[$i]]);
            }
        }

        // --- 2d. Draft survey — demo is VIEWER ---
        $s2d = Survey::firstOrCreate(
            ['title' => 'Internal Security Audit Checklist', 'owner_id' => $alice->id],
            [
                'description' => 'Pre-audit checklist for the IT security review.',
                'status'      => 'draft',
                'is_public'   => false,
            ]
        );
        $s2d->collaborators()->syncWithoutDetaching([
            $demo->id => ['role' => 'viewer'],
        ]);

        if ($s2d->questions()->count() === 0) {
            Question::create(['survey_id' => $s2d->id, 'type' => 'SINGLE_CHOICE', 'text' => 'Is 2FA enabled on all admin accounts?',        'options' => ['Yes', 'No', 'Partially'], 'required' => true, 'position' => 0]);
            Question::create(['survey_id' => $s2d->id, 'type' => 'SINGLE_CHOICE', 'text' => 'Are all dependencies up to date?',               'options' => ['Yes', 'No', 'In Progress'], 'required' => true, 'position' => 1]);
            Question::create(['survey_id' => $s2d->id, 'type' => 'SHORT_TEXT',     'text' => 'List any known vulnerabilities.',                'options' => null, 'required' => false, 'position' => 2]);
            Question::create(['survey_id' => $s2d->id, 'type' => 'SHORT_TEXT',     'text' => 'Date of last penetration test.',                 'options' => null, 'required' => false, 'position' => 3]);
        }

        /* ════════════════════════════════════════
         *  3. SURVEYS OWNED BY BOB → shared with demo
         * ════════════════════════════════════════ */

        // --- 3a. Published survey — demo is EDITOR ---
        $s3a = Survey::firstOrCreate(
            ['title' => 'Sprint Retrospective – February 2026', 'owner_id' => $bob->id],
            [
                'description' => 'Share what went well and what we can improve for next sprint.',
                'slug'        => Str::random(12),
                'status'      => 'published',
                'is_public'   => false,
            ]
        );
        $s3a->collaborators()->syncWithoutDetaching([
            $demo->id  => ['role' => 'editor'],
            $alice->id => ['role' => 'viewer'],
        ]);

        if ($s3a->questions()->count() === 0) {
            $rq1 = Question::create(['survey_id' => $s3a->id, 'type' => 'SHORT_TEXT',     'text' => 'What went well this sprint?',                  'options' => null, 'required' => true, 'position' => 0]);
            $rq2 = Question::create(['survey_id' => $s3a->id, 'type' => 'SHORT_TEXT',     'text' => 'What could be improved?',                      'options' => null, 'required' => true, 'position' => 1]);
            $rq3 = Question::create(['survey_id' => $s3a->id, 'type' => 'NUMBER',         'text' => 'Overall sprint satisfaction (1-5).',            'options' => null, 'required' => true, 'position' => 2]);
            $rq4 = Question::create(['survey_id' => $s3a->id, 'type' => 'SINGLE_CHOICE',  'text' => 'Was the sprint goal achieved?',                'options' => ['Yes', 'Partially', 'No'], 'required' => true, 'position' => 3]);

            $wentWell     = ['Great collaboration', 'Deployed on time', 'Good test coverage', 'Clear requirements'];
            $toImprove    = ['Too many meetings', 'Better estimation', 'More code reviews', 'Less scope creep'];
            $satisfaction = ['4', '3', '5', '4'];
            $goalAchieved = ['Yes', 'Partially', 'Yes', 'Yes'];

            for ($i = 0; $i < 4; $i++) {
                $resp = Response::create(['survey_id' => $s3a->id]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $rq1->id, 'value' => $wentWell[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $rq2->id, 'value' => $toImprove[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $rq3->id, 'value' => $satisfaction[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $rq4->id, 'value' => $goalAchieved[$i]]);
            }
        }

        // --- 3b. Published survey — demo is VIEWER ---
        $s3b = Survey::firstOrCreate(
            ['title' => 'Hackathon 2026 Feedback', 'owner_id' => $bob->id],
            [
                'description' => 'Post-event survey for our internal hackathon.',
                'slug'        => Str::random(12),
                'status'      => 'published',
                'is_public'   => true,
            ]
        );
        $s3b->collaborators()->syncWithoutDetaching([
            $demo->id  => ['role' => 'viewer'],
            $alice->id => ['role' => 'editor'],
        ]);

        if ($s3b->questions()->count() === 0) {
            $hq1 = Question::create(['survey_id' => $s3b->id, 'type' => 'SINGLE_CHOICE', 'text' => 'How would you rate the hackathon overall?',     'options' => ['Amazing', 'Good', 'Okay', 'Poor'], 'required' => true, 'position' => 0]);
            $hq2 = Question::create(['survey_id' => $s3b->id, 'type' => 'MULTI_CHOICE',  'text' => 'Which activities did you enjoy?',                'options' => ['Coding', 'Workshops', 'Networking', 'Demos', 'Food'], 'required' => false, 'position' => 1]);
            $hq3 = Question::create(['survey_id' => $s3b->id, 'type' => 'NUMBER',        'text' => 'How likely are you to attend next year? (1-10)', 'options' => null, 'required' => true, 'position' => 2]);
            $hq4 = Question::create(['survey_id' => $s3b->id, 'type' => 'LONG_TEXT',     'text' => 'Suggestions for next year?',                     'options' => null, 'required' => false, 'position' => 3]);

            $hackRatings = ['Amazing', 'Good', 'Amazing', 'Good', 'Okay', 'Amazing', 'Good'];
            $activities  = [
                ['Coding', 'Networking'], ['Workshops', 'Demos'], ['Coding', 'Food', 'Demos'],
                ['Networking'], ['Coding', 'Workshops'], ['Coding', 'Networking', 'Food'],
                ['Workshops', 'Networking', 'Demos'],
            ];
            $attendAgain = ['10', '8', '9', '7', '6', '10', '8'];
            $suggestions = [
                'More time for coding!', 'Add a design track.', 'Loved it, no changes needed.',
                'Better Wi-Fi please.', 'Longer event would be nice.', 'Add prizes for all participants.',
                'Invite external speakers.',
            ];

            for ($i = 0; $i < 7; $i++) {
                $resp = Response::create(['survey_id' => $s3b->id]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $hq1->id, 'value' => $hackRatings[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $hq2->id, 'value' => $activities[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $hq3->id, 'value' => $attendAgain[$i]]);
                Answer::create(['response_id' => $resp->id, 'question_id' => $hq4->id, 'value' => $suggestions[$i]]);
            }
        }
    }
}
