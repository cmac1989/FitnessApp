<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Preserve existing user accounts ───────────────────────────────
        User::updateOrCreate(
            ['email' => 'client@example.com'],
            [
                'name'     => 'Jordan Smith',
                'password' => bcrypt('Test1234!'),
                'role'     => 'client',
                'bio'      => 'Trying to lose weight and build some muscle.',
            ]
        );

        User::updateOrCreate(
            ['email' => 'trainer@example.com'],
            [
                'name'     => 'Alex Rivera',
                'password' => bcrypt('Test1234!'),
                'role'     => 'trainer',
                'bio'      => 'Certified personal trainer with 8 years of experience.',
            ]
        );

        // ── 2. Resolve trainer + clients ─────────────────────────────────────
        $trainer = User::where('email', 'trainer@example.com')->first();
        if (!$trainer) {
            $this->command->warn('No trainer found — aborting seed.');
            return;
        }

        // All clients linked to this trainer
        $clients = User::whereHas('clientProfile', fn ($q) =>
            $q->where('trainer_id', $trainer->id)
        )->get();

        if ($clients->isEmpty()) {
            $this->command->warn('No clients linked to trainer — skipping relational seed.');
            $this->command->info('Link a client to trainer@example.com first, then re-run.');
            return;
        }

        // ── 3. Clear non-user data ────────────────────────────────────────────
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        DB::table('notifications')->truncate();
        DB::table('message_reactions')->truncate();
        DB::table('messages')->truncate();
        DB::table('workout_assignment_comment_reactions')->truncate();
        DB::table('workout_assignment_comments')->truncate();
        DB::table('workout_assignment_reactions')->truncate();
        DB::table('workout_assignments')->truncate();
        DB::table('workout_exercises')->truncate();
        DB::table('workouts')->truncate();
        DB::table('exercise_library')->truncate();
        DB::table('programs')->truncate();
        DB::table('program_workouts')->truncate();
        DB::table('check_ins')->truncate();
        DB::table('client_metrics')->truncate();
        DB::table('client_goals')->truncate();
        DB::table('client_invitations')->truncate();
        DB::table('training_sessions')->truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->command->info('Tables cleared. Seeding data...');

        // ── 4. Seed exercise library ──────────────────────────────────────────
        $exercises = $this->seedExerciseLibrary();

        // ── 5. Seed workouts with exercises ───────────────────────────────────
        $workouts = $this->seedWorkouts($trainer, $exercises);

        // ── 6. Seed everything per client ─────────────────────────────────────
        foreach ($clients as $client) {
            $this->seedClientData($trainer, $client, $workouts);
        }

        $this->command->info('Seed complete.');
    }

    // ── Exercise library ─────────────────────────────────────────────────────

    private function seedExerciseLibrary(): \Illuminate\Support\Collection
    {
        $rows = [
            [
                'external_id'        => 'seed_0001',
                'name'               => 'Barbell Bench Press',
                'body_part'          => 'chest',
                'equipment'          => 'barbell',
                'target'             => 'pectorals',
                'gif_url'            => 'https://example.com/exercises/bench-press.gif',
                'secondary_muscles'  => json_encode(['triceps', 'delts']),
                'instructions'       => json_encode(['Lie flat on bench', 'Lower bar to chest', 'Press up to full extension']),
            ],
            [
                'external_id'        => 'seed_0002',
                'name'               => 'Barbell Back Squat',
                'body_part'          => 'upper legs',
                'equipment'          => 'barbell',
                'target'             => 'quads',
                'gif_url'            => 'https://example.com/exercises/squat.gif',
                'secondary_muscles'  => json_encode(['glutes', 'hamstrings', 'core']),
                'instructions'       => json_encode(['Bar across upper back', 'Feet shoulder-width', 'Squat to parallel', 'Drive through heels']),
            ],
            [
                'external_id'        => 'seed_0003',
                'name'               => 'Pull-Up',
                'body_part'          => 'back',
                'equipment'          => 'body weight',
                'target'             => 'lats',
                'gif_url'            => 'https://example.com/exercises/pull-up.gif',
                'secondary_muscles'  => json_encode(['biceps', 'rear delts']),
                'instructions'       => json_encode(['Hang from bar with overhand grip', 'Pull chest to bar', 'Lower with control']),
            ],
            [
                'external_id'        => 'seed_0004',
                'name'               => 'Romanian Deadlift',
                'body_part'          => 'upper legs',
                'equipment'          => 'barbell',
                'target'             => 'hamstrings',
                'gif_url'            => 'https://example.com/exercises/rdl.gif',
                'secondary_muscles'  => json_encode(['glutes', 'lower back']),
                'instructions'       => json_encode(['Stand hip-width', 'Hinge at hips keeping back straight', 'Lower until stretch', 'Drive hips forward']),
            ],
            [
                'external_id'        => 'seed_0005',
                'name'               => 'Overhead Press',
                'body_part'          => 'shoulders',
                'equipment'          => 'barbell',
                'target'             => 'delts',
                'gif_url'            => 'https://example.com/exercises/ohp.gif',
                'secondary_muscles'  => json_encode(['triceps', 'upper chest']),
                'instructions'       => json_encode(['Bar at shoulder height', 'Press directly overhead', 'Lock out at top']),
            ],
            [
                'external_id'        => 'seed_0006',
                'name'               => 'Dumbbell Lunges',
                'body_part'          => 'upper legs',
                'equipment'          => 'dumbbell',
                'target'             => 'quads',
                'gif_url'            => 'https://example.com/exercises/lunges.gif',
                'secondary_muscles'  => json_encode(['glutes', 'hamstrings']),
                'instructions'       => json_encode(['Step forward with one leg', 'Lower back knee toward floor', 'Push back to start']),
            ],
            [
                'external_id'        => 'seed_0007',
                'name'               => 'Cable Row',
                'body_part'          => 'back',
                'equipment'          => 'cable',
                'target'             => 'lats',
                'gif_url'            => 'https://example.com/exercises/cable-row.gif',
                'secondary_muscles'  => json_encode(['biceps', 'rear delts', 'rhomboids']),
                'instructions'       => json_encode(['Sit at cable machine', 'Row handle to midsection', 'Squeeze shoulder blades']),
            ],
            [
                'external_id'        => 'seed_0008',
                'name'               => 'Incline Dumbbell Press',
                'body_part'          => 'chest',
                'equipment'          => 'dumbbell',
                'target'             => 'upper pectorals',
                'gif_url'            => 'https://example.com/exercises/incline-db.gif',
                'secondary_muscles'  => json_encode(['triceps', 'front delts']),
                'instructions'       => json_encode(['Set bench to 30-45 degrees', 'Press dumbbells up and slightly inward', 'Lower with control']),
            ],
            [
                'external_id'        => 'seed_0009',
                'name'               => 'Plank',
                'body_part'          => 'waist',
                'equipment'          => 'body weight',
                'target'             => 'abs',
                'gif_url'            => 'https://example.com/exercises/plank.gif',
                'secondary_muscles'  => json_encode(['glutes', 'shoulders']),
                'instructions'       => json_encode(['Forearms on floor, body in straight line', 'Hold position', 'Breathe steadily']),
            ],
            [
                'external_id'        => 'seed_0010',
                'name'               => 'Leg Press',
                'body_part'          => 'upper legs',
                'equipment'          => 'machine',
                'target'             => 'quads',
                'gif_url'            => 'https://example.com/exercises/leg-press.gif',
                'secondary_muscles'  => json_encode(['glutes', 'hamstrings']),
                'instructions'       => json_encode(['Sit in machine', 'Feet shoulder-width on platform', 'Lower platform until 90 degrees', 'Press to extension']),
            ],
        ];

        foreach ($rows as $row) {
            $row['created_at'] = now();
            $row['updated_at'] = now();
            DB::table('exercise_library')->insert($row);
        }

        return DB::table('exercise_library')->get()->keyBy('external_id');
    }

    // ── Workouts ──────────────────────────────────────────────────────────────

    private function seedWorkouts($trainer, $exercises): \Illuminate\Support\Collection
    {
        $definitions = [
            [
                'title'       => 'Upper Body Strength A',
                'description' => 'Heavy compound push/pull focusing on chest, back and shoulders.',
                'difficulty'  => 'intermediate',
                'duration'    => 55,
                'exercises'   => [
                    ['id' => 'seed_0001', 'sets' => '4', 'reps' => '6-8',  'order' => 0],
                    ['id' => 'seed_0005', 'sets' => '3', 'reps' => '8-10', 'order' => 1],
                    ['id' => 'seed_0003', 'sets' => '3', 'reps' => '6-8',  'order' => 2],
                    ['id' => 'seed_0007', 'sets' => '3', 'reps' => '10-12','order' => 3],
                ],
            ],
            [
                'title'       => 'Lower Body Power',
                'description' => 'Squat-focused lower body session with accessory work.',
                'difficulty'  => 'intermediate',
                'duration'    => 60,
                'exercises'   => [
                    ['id' => 'seed_0002', 'sets' => '4', 'reps' => '5',    'order' => 0],
                    ['id' => 'seed_0004', 'sets' => '3', 'reps' => '8-10', 'order' => 1],
                    ['id' => 'seed_0006', 'sets' => '3', 'reps' => '12',   'order' => 2],
                    ['id' => 'seed_0010', 'sets' => '3', 'reps' => '12-15','order' => 3],
                ],
            ],
            [
                'title'       => 'Upper Body Hypertrophy B',
                'description' => 'Moderate weight, higher reps. Chest emphasis.',
                'difficulty'  => 'beginner',
                'duration'    => 50,
                'exercises'   => [
                    ['id' => 'seed_0008', 'sets' => '4', 'reps' => '10-12','order' => 0],
                    ['id' => 'seed_0001', 'sets' => '3', 'reps' => '12',   'order' => 1],
                    ['id' => 'seed_0007', 'sets' => '3', 'reps' => '12-15','order' => 2],
                    ['id' => 'seed_0009', 'sets' => '3', 'reps' => '45s',  'order' => 3],
                ],
            ],
            [
                'title'       => 'Full Body Circuit',
                'description' => 'Fast-paced full body workout. Great for fat loss.',
                'difficulty'  => 'beginner',
                'duration'    => 40,
                'exercises'   => [
                    ['id' => 'seed_0002', 'sets' => '3', 'reps' => '15',   'order' => 0],
                    ['id' => 'seed_0003', 'sets' => '3', 'reps' => '10',   'order' => 1],
                    ['id' => 'seed_0006', 'sets' => '3', 'reps' => '12',   'order' => 2],
                    ['id' => 'seed_0009', 'sets' => '3', 'reps' => '60s',  'order' => 3],
                ],
            ],
            [
                'title'       => 'Advanced Strength Day',
                'description' => 'Heavy lower + accessory. Not for beginners.',
                'difficulty'  => 'advanced',
                'duration'    => 75,
                'exercises'   => [
                    ['id' => 'seed_0002', 'sets' => '5', 'reps' => '3',    'order' => 0],
                    ['id' => 'seed_0004', 'sets' => '4', 'reps' => '5',    'order' => 1],
                    ['id' => 'seed_0010', 'sets' => '4', 'reps' => '8',    'order' => 2],
                    ['id' => 'seed_0009', 'sets' => '4', 'reps' => '60s',  'order' => 3],
                ],
            ],
            [
                'title'       => 'Pull Day',
                'description' => 'Back and biceps volume session.',
                'difficulty'  => 'intermediate',
                'duration'    => 50,
                'exercises'   => [
                    ['id' => 'seed_0003', 'sets' => '4', 'reps' => '8',    'order' => 0],
                    ['id' => 'seed_0007', 'sets' => '4', 'reps' => '10-12','order' => 1],
                    ['id' => 'seed_0004', 'sets' => '3', 'reps' => '10',   'order' => 2],
                ],
            ],
        ];

        $created = collect();

        foreach ($definitions as $def) {
            $workoutId = DB::table('workouts')->insertGetId([
                'user_id'      => $trainer->id,
                'title'        => $def['title'],
                'description'  => $def['description'],
                'difficulty'   => $def['difficulty'],
                'duration'     => $def['duration'],
                'workout_list' => null,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            foreach ($def['exercises'] as $ex) {
                $libEx = $exercises->get($ex['id']);
                if (!$libEx) continue;
                DB::table('workout_exercises')->insert([
                    'workout_id'          => $workoutId,
                    'exercise_library_id' => $libEx->id,
                    'order_index'         => $ex['order'],
                    'sets'                => $ex['sets'],
                    'reps'                => $ex['reps'],
                    'notes'               => null,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ]);
            }

            $created->push((object) ['id' => $workoutId, 'title' => $def['title']]);
        }

        return $created;
    }

    // ── Per-client data ───────────────────────────────────────────────────────

    private function seedClientData($trainer, $client, $workouts): void
    {
        $this->command->info("Seeding data for client: {$client->name}");

        $this->seedGoals($client);
        $this->seedMetrics($client);
        $assignments = $this->seedAssignments($trainer, $client, $workouts);
        $this->seedCheckIns($trainer, $client);
        $this->seedMessages($trainer, $client);
        $this->seedNotifications($trainer, $client, $assignments);
    }

    // ── Goals ─────────────────────────────────────────────────────────────────

    private function seedGoals($client): void
    {
        $goals = [
            [
                'type'          => 'weight_loss',
                'description'   => 'Get down to 175 lbs by summer',
                'start_value'   => 196.0,
                'current_value' => 188.5,
                'target_value'  => 175.0,
                'unit'          => 'lbs',
                'deadline'      => Carbon::now()->addMonths(3)->format('Y-m-d'),
                'status'        => 'active',
            ],
            [
                'type'          => 'strength',
                'description'   => 'Bench press 185 lbs for 5 reps',
                'start_value'   => 135.0,
                'current_value' => 155.0,
                'target_value'  => 185.0,
                'unit'          => 'lbs',
                'deadline'      => Carbon::now()->addMonths(4)->format('Y-m-d'),
                'status'        => 'active',
            ],
            [
                'type'          => 'endurance',
                'description'   => 'Complete 5k without stopping',
                'start_value'   => null,
                'current_value' => null,
                'target_value'  => null,
                'unit'          => null,
                'deadline'      => Carbon::now()->addMonths(2)->format('Y-m-d'),
                'status'        => 'active',
            ],
        ];

        foreach ($goals as $goal) {
            DB::table('client_goals')->insert(array_merge($goal, [
                'client_id'  => $client->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    // ── Metrics ───────────────────────────────────────────────────────────────

    private function seedMetrics($client): void
    {
        $now    = Carbon::now();
        $weight = 196.0;

        for ($i = 8; $i >= 0; $i--) {
            $date    = $now->copy()->subWeeks($i)->startOfWeek();
            $weight -= rand(2, 7) / 10; // slow downward trend

            DB::table('client_metrics')->insert([
                'client_id'   => $client->id,
                'type'        => 'weight',
                'value'       => round($weight, 1),
                'unit'        => 'lbs',
                'notes'       => null,
                'recorded_at' => $date->format('Y-m-d H:i:s'),
                'created_at'  => $date->format('Y-m-d H:i:s'),
                'updated_at'  => $date->format('Y-m-d H:i:s'),
            ]);
        }

        // Body fat %
        $bodyFat = 24.0;
        for ($i = 8; $i >= 0; $i -= 2) {
            $date     = $now->copy()->subWeeks($i)->startOfWeek();
            $bodyFat -= 0.3;
            DB::table('client_metrics')->insert([
                'client_id'   => $client->id,
                'type'        => 'body_fat',
                'value'       => round($bodyFat, 1),
                'unit'        => '%',
                'notes'       => null,
                'recorded_at' => $date->format('Y-m-d H:i:s'),
                'created_at'  => $date->format('Y-m-d H:i:s'),
                'updated_at'  => $date->format('Y-m-d H:i:s'),
            ]);
        }
    }

    // ── Workout assignments ───────────────────────────────────────────────────

    private function seedAssignments($trainer, $client, $workouts): array
    {
        $now         = Carbon::now();
        $assignments = [];

        // Assign each workout once. unique(workout_id, client_id) — one entry per workout.
        // Mix of old completed, recent completed, recent incomplete, and upcoming.
        $schedule = [
            ['workout_idx' => 0, 'offset_days' => -42, 'completed' => true],
            ['workout_idx' => 1, 'offset_days' => -35, 'completed' => true],
            ['workout_idx' => 2, 'offset_days' => -21, 'completed' => true],
            ['workout_idx' => 3, 'offset_days' => -14, 'completed' => true],
            ['workout_idx' => 4, 'offset_days' =>  -4, 'completed' => false],
            ['workout_idx' => 5, 'offset_days' =>   3, 'completed' => false],
        ];

        // Track used workout IDs to avoid violating unique(workout_id, client_id)
        $usedWorkoutIds = [];

        foreach ($schedule as $item) {
            $workout = $workouts->get($item['workout_idx']);
            if (!$workout) continue;

            // Skip if this workout is already assigned to this client
            if (in_array($workout->id, $usedWorkoutIds)) continue;
            $usedWorkoutIds[] = $workout->id;

            $date        = $now->copy()->addDays($item['offset_days'])->format('Y-m-d');
            $completedAt = $item['completed']
                ? $now->copy()->addDays($item['offset_days'])->setHour(19)->format('Y-m-d H:i:s')
                : null;

            $assignmentId = DB::table('workout_assignments')->insertGetId([
                'workout_id'     => $workout->id,
                'client_id'      => $client->id,
                'trainer_id'     => $trainer->id,
                'scheduled_date' => $date,
                'completed_at'   => $completedAt,
                'created_at'     => $now->copy()->addDays($item['offset_days'] - 1)->format('Y-m-d H:i:s'),
                'updated_at'     => $completedAt ?? $now->copy()->addDays($item['offset_days'] - 1)->format('Y-m-d H:i:s'),
            ]);

            $assignments[] = [
                'id'           => $assignmentId,
                'workout'      => $workout,
                'completed_at' => $completedAt,
                'date'         => $date,
            ];

            // Trainer likes completed workouts
            if ($completedAt && $item['offset_days'] > -20) {
                DB::table('workout_assignment_reactions')->insert([
                    'assignment_id' => $assignmentId,
                    'user_id'       => $trainer->id,
                    'created_at'    => Carbon::parse($completedAt)->addMinutes(15)->format('Y-m-d H:i:s'),
                    'updated_at'    => Carbon::parse($completedAt)->addMinutes(15)->format('Y-m-d H:i:s'),
                ]);
            }

            // Trainer comment on recent completed workouts
            if ($completedAt && $item['offset_days'] >= -22) {
                $commentId = DB::table('workout_assignment_comments')->insertGetId([
                    'assignment_id' => $assignmentId,
                    'user_id'       => $trainer->id,
                    'body'          => $this->trainerComment($workout->title),
                    'created_at'    => Carbon::parse($completedAt)->addMinutes(20)->format('Y-m-d H:i:s'),
                    'updated_at'    => Carbon::parse($completedAt)->addMinutes(20)->format('Y-m-d H:i:s'),
                ]);

                // Client likes the trainer comment
                DB::table('workout_assignment_comment_reactions')->insert([
                    'comment_id' => $commentId,
                    'user_id'    => $client->id,
                    'created_at' => Carbon::parse($completedAt)->addHours(1)->format('Y-m-d H:i:s'),
                    'updated_at' => Carbon::parse($completedAt)->addHours(1)->format('Y-m-d H:i:s'),
                ]);
            }
        }

        return $assignments;
    }

    // ── Check-ins ─────────────────────────────────────────────────────────────

    private function seedCheckIns($trainer, $client): void
    {
        $now    = Carbon::now();
        $weight = 196.0;

        for ($weeksAgo = 7; $weeksAgo >= 1; $weeksAgo--) {
            $weekStart   = $now->copy()->subWeeks($weeksAgo)->startOfWeek()->format('Y-m-d');
            $submittedAt = $now->copy()->subWeeks($weeksAgo)->startOfWeek()->addDays(6)->setHour(20)->format('Y-m-d H:i:s');
            $reviewedAt  = $weeksAgo > 1
                ? $now->copy()->subWeeks($weeksAgo - 1)->startOfWeek()->addDay()->setHour(10)->format('Y-m-d H:i:s')
                : null;
            $weight     -= rand(2, 8) / 10;

            $adherence = rand(70, 100);
            $energy    = rand(55, 90);

            $clientNotes = $this->clientCheckInNotes($adherence, $energy);
            $trainerFeedback = $reviewedAt ? $this->trainerFeedback($adherence, $energy) : null;
            $trainerAdjustments = ($reviewedAt && $adherence < 80)
                ? 'Reduce workout volume slightly this week. Focus on consistency over intensity.'
                : null;

            DB::table('check_ins')->insert([
                'client_id'           => $client->id,
                'trainer_id'          => $trainer->id,
                'week_start'          => $weekStart,
                'weight'              => round($weight, 1),
                'weight_unit'         => 'lbs',
                'adherence_score'     => $adherence,
                'energy_score'        => $energy,
                'client_notes'        => $clientNotes,
                'trainer_feedback'    => $trainerFeedback,
                'trainer_adjustments' => $trainerAdjustments,
                'submitted_at'        => $submittedAt,
                'reviewed_at'         => $reviewedAt,
                'created_at'          => $submittedAt,
                'updated_at'          => $reviewedAt ?? $submittedAt,
            ]);
        }
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    private function seedMessages($trainer, $client): void
    {
        $now = Carbon::now();

        $conversation = [
            // 3 weeks ago
            ['sender' => 'trainer', 'days_ago' => 21, 'text' => "Hey {$client->name}! How are you feeling going into this week?"],
            ['sender' => 'client', 'days_ago' => 21, 'hours_offset' => 2, 'text' => "Pretty good! A bit sore from Monday's session but ready to go."],
            ['sender' => 'trainer', 'days_ago' => 21, 'hours_offset' => 3, 'text' => 'That soreness is normal — means we hit the right muscles. Make sure to get enough protein today.'],
            // 2 weeks ago
            ['sender' => 'trainer', 'days_ago' => 14, 'text' => "Great job completing Lower Body Power this week! Your consistency is showing."],
            ['sender' => 'client', 'days_ago' => 14, 'hours_offset' => 1, 'text' => 'Thanks! The Romanian deadlifts felt way better this time. I think my form is improving.'],
            ['sender' => 'trainer', 'days_ago' => 14, 'hours_offset' => 2, 'text' => "Definitely seeing improvement. Let's push the weight up 5 lbs next session."],
            // 1 week ago
            ['sender' => 'client', 'days_ago' => 8, 'text' => 'Had to miss Wednesday — work was crazy. Should I make it up or just move on?'],
            ['sender' => 'trainer', 'days_ago' => 8, 'hours_offset' => 1, 'text' => "No worries, life happens. Just move on and hit this week's schedule fresh. Don't try to double up."],
            ['sender' => 'client', 'days_ago' => 8, 'hours_offset' => 2, 'text' => 'Got it, thanks! That makes me feel better.'],
            // This week
            ['sender' => 'trainer', 'days_ago' => 3, 'text' => "Reminder: check-in is due Sunday. Looking forward to seeing your progress numbers!"],
            ['sender' => 'client', 'days_ago' => 3, 'hours_offset' => 3, 'text' => "Will do! Down another pound this week I think 💪"],
            ['sender' => 'trainer', 'days_ago' => 3, 'hours_offset' => 4, 'text' => "Love to hear it! Keep it up — you're on track."],
            // Yesterday
            ['sender' => 'client', 'days_ago' => 1, 'text' => "Quick question — can I sub the pull-ups for lat pulldowns? My shoulder is a bit achy."],
            ['sender' => 'trainer', 'days_ago' => 1, 'hours_offset' => 1, 'text' => 'Yes, absolutely. Same weight scheme. If it still bothers you let me know and we can look at it.'],
        ];

        $clientProfile = DB::table('client_profiles')->where('user_id', $client->id)->first();
        $trainerId = $trainer->id;

        foreach ($conversation as $msg) {
            $senderId   = $msg['sender'] === 'trainer' ? $trainer->id : $client->id;
            $receiverId = $msg['sender'] === 'trainer' ? $client->id  : $trainer->id;
            $hoursOffset = $msg['hours_offset'] ?? 0;

            $sentAt = $now->copy()
                ->subDays($msg['days_ago'])
                ->setHour(9 + $hoursOffset)
                ->setMinute(rand(0, 59))
                ->format('Y-m-d H:i:s');

            DB::table('messages')->insert([
                'sender_id'    => $senderId,
                'receiver_id'  => $receiverId,
                'trainer_id'   => $trainerId,
                'content'      => $msg['text'],
                'read_at'      => $sentAt,  // all historical messages are read
                'scheduled_at' => null,
                'deleted_at'   => null,
                'created_at'   => $sentAt,
                'updated_at'   => $sentAt,
            ]);
        }
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    private function seedNotifications($trainer, $client, array $assignments): void
    {
        $now = Carbon::now();

        // workout_completed notifications (for trainer)
        foreach ($assignments as $a) {
            if (!$a['completed_at']) continue;
            $completedAt = Carbon::parse($a['completed_at']);
            if ($completedAt->lt($now->copy()->subWeeks(6))) continue; // only last 6 weeks

            DB::table('notifications')->insert([
                'user_id'    => $trainer->id,
                'type'       => 'workout_completed',
                'data'       => json_encode([
                    'message'       => "{$client->name} completed \"{$a['workout']->title}\".",
                    'assignment_id' => $a['id'],
                    'client_name'   => $client->name,
                    'sender_id'     => $client->id,
                ]),
                'read_at'    => $completedAt->copy()->addHours(2)->format('Y-m-d H:i:s'),
                'created_at' => $completedAt->format('Y-m-d H:i:s'),
                'updated_at' => $completedAt->format('Y-m-d H:i:s'),
            ]);
        }

        // workout_liked notifications (for client — trainer liked their completed workouts)
        foreach ($assignments as $a) {
            if (!$a['completed_at']) continue;
            $completedAt = Carbon::parse($a['completed_at']);
            if ($completedAt->lt($now->copy()->subWeeks(2))) continue;

            DB::table('notifications')->insert([
                'user_id'    => $client->id,
                'type'       => 'workout_liked',
                'data'       => json_encode([
                    'message'       => "{$trainer->name} liked your workout \"{$a['workout']->title}\".",
                    'assignment_id' => $a['id'],
                    'trainer_name'  => $trainer->name,
                    'sender_id'     => $trainer->id,
                ]),
                'read_at'    => $completedAt->copy()->addHours(1)->format('Y-m-d H:i:s'),
                'created_at' => $completedAt->copy()->addMinutes(15)->format('Y-m-d H:i:s'),
                'updated_at' => $completedAt->copy()->addMinutes(15)->format('Y-m-d H:i:s'),
            ]);
        }

        // workout_commented notifications (for client — trainer commented)
        foreach ($assignments as $idx => $a) {
            if (!$a['completed_at']) continue;
            $completedAt = Carbon::parse($a['completed_at']);
            if ($completedAt->lt($now->copy()->subWeeks(2))) continue;

            $comments = [
                "Great session! Form is looking solid.",
                "Really strong effort on this one. Keep it up!",
            ];
            $body = $comments[$idx % count($comments)];

            DB::table('notifications')->insert([
                'user_id'    => $client->id,
                'type'       => 'workout_commented',
                'data'       => json_encode([
                    'message'       => "{$trainer->name}: \"{$body}\"",
                    'assignment_id' => $a['id'],
                    'workout_title' => $a['workout']->title,
                    'trainer_name'  => $trainer->name,
                    'sender_id'     => $trainer->id,
                ]),
                'read_at'    => null,  // unread
                'created_at' => $completedAt->copy()->addMinutes(20)->format('Y-m-d H:i:s'),
                'updated_at' => $completedAt->copy()->addMinutes(20)->format('Y-m-d H:i:s'),
            ]);
        }

        // comment_liked notification (for trainer — client liked trainer's comment)
        foreach ($assignments as $idx => $a) {
            if (!$a['completed_at']) continue;
            $completedAt = Carbon::parse($a['completed_at']);
            if ($completedAt->lt($now->copy()->subWeeks(2))) continue;

            DB::table('notifications')->insert([
                'user_id'    => $trainer->id,
                'type'       => 'comment_liked',
                'data'       => json_encode([
                    'message'       => "{$client->name} liked your comment on \"{$a['workout']->title}\".",
                    'assignment_id' => $a['id'],
                    'workout_title' => $a['workout']->title,
                    'client_name'   => $client->name,
                    'sender_id'     => $client->id,
                ]),
                'read_at'    => null,  // unread
                'created_at' => $completedAt->copy()->addHours(1)->format('Y-m-d H:i:s'),
                'updated_at' => $completedAt->copy()->addHours(1)->format('Y-m-d H:i:s'),
            ]);
        }

        // check_in_submitted notification (for trainer)
        $now2 = Carbon::now();
        for ($weeksAgo = 7; $weeksAgo >= 2; $weeksAgo--) {
            $submittedAt = $now2->copy()->subWeeks($weeksAgo)->startOfWeek()->addDays(6)->setHour(20);
            DB::table('notifications')->insert([
                'user_id'    => $trainer->id,
                'type'       => 'check_in_submitted',
                'data'       => json_encode([
                    'message'    => "{$client->name} submitted their weekly check-in.",
                    'client_name'=> $client->name,
                    'sender_id'  => $client->id,
                ]),
                'read_at'    => $submittedAt->copy()->addDay()->format('Y-m-d H:i:s'),
                'created_at' => $submittedAt->format('Y-m-d H:i:s'),
                'updated_at' => $submittedAt->format('Y-m-d H:i:s'),
            ]);
        }

        // check_in_reviewed notification (for client) — this week's unread
        $reviewedAt = $now->copy()->subDays(2)->setHour(10);
        DB::table('notifications')->insert([
            'user_id'    => $client->id,
            'type'       => 'check_in_reviewed',
            'data'       => json_encode([
                'message'      => "{$trainer->name} reviewed your check-in.",
                'trainer_name' => $trainer->name,
                'sender_id'    => $trainer->id,
            ]),
            'read_at'    => null,  // unread
            'created_at' => $reviewedAt->format('Y-m-d H:i:s'),
            'updated_at' => $reviewedAt->format('Y-m-d H:i:s'),
        ]);
    }

    // ── Copy helpers ──────────────────────────────────────────────────────────

    private function trainerComment(string $workoutTitle): string
    {
        $comments = [
            "Great work on {$workoutTitle}! Your form is really improving.",
            "Solid session! {$workoutTitle} is tough but you crushed it.",
            "Really consistent effort. {$workoutTitle} done — keep building on this.",
            "Love the dedication. {$workoutTitle} is now in your toolkit!",
        ];
        return $comments[array_rand($comments)];
    }

    private function clientCheckInNotes(int $adherence, int $energy): string
    {
        if ($adherence >= 90) {
            return "Hit all my sessions this week. Feeling strong and motivated. Sleep has been good too.";
        } elseif ($adherence >= 75) {
            return "Missed one session (work got hectic) but otherwise stayed on track. Energy was decent.";
        } else {
            return "Rough week — work stress and poor sleep affected my workouts. Did what I could.";
        }
    }

    private function trainerFeedback(int $adherence, int $energy): string
    {
        if ($adherence >= 90) {
            return "Excellent week! Consistency is your superpower right now. Keep the momentum going — we'll bump intensity next week.";
        } elseif ($adherence >= 75) {
            return "Good effort this week. Missing one session happens — what matters is you stayed consistent overall. Let's aim for full adherence next week.";
        } else {
            return "I can see this was a tough week. Remember: a bad week doesn't undo the progress you've built. Rest, reset, and let's come back strong.";
        }
    }
}
