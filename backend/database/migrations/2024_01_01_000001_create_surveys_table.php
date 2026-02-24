<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('slug')->unique()->nullable();
            $table->string('status')->default('draft');
            $table->boolean('is_public')->default(false);

            // Scheduling
            $table->boolean('is_accepting_responses')->default(true);
            $table->timestamp('opens_at')->nullable();
            $table->timestamp('closes_at')->nullable();

            // Respondent settings
            $table->boolean('require_name')->default(false);
            $table->boolean('require_email')->default(false);
            $table->string('access_password')->nullable();

            // Time and theming
            $table->unsignedInteger('time_limit')->nullable();
            $table->string('theme_color', 20)->nullable();
            $table->longText('banner_image')->nullable();

            // Submit display
            $table->boolean('show_responses_after_submit')->default(false);
            $table->boolean('show_correct_after_submit')->default(false);

            // Question display settings
            $table->boolean('one_question_per_page')->default(false);
            $table->boolean('prevent_going_back')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surveys');
    }
};
