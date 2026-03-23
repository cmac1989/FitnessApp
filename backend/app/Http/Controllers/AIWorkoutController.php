<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class AIWorkoutController extends Controller
{
    // Prompt constraints
    private const MIN_PROMPT_LENGTH = 10;
    private const MAX_PROMPT_LENGTH = 400;
    private const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

    public function generate(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string',
        ]);

        // ── Sanitize & guard the prompt ───────────────────────────────────────

        $prompt = $this->sanitizePrompt($request->input('prompt'));

        if (strlen($prompt) < self::MIN_PROMPT_LENGTH) {
            return response()->json([
                'error' => 'Prompt too short. Please describe the workout in more detail.',
            ], 422);
        }

        if (strlen($prompt) > self::MAX_PROMPT_LENGTH) {
            return response()->json([
                'error' => 'Prompt too long. Please keep your description under ' . self::MAX_PROMPT_LENGTH . ' characters.',
                'length' => strlen($prompt),
            ], 422);
        }

        // Must contain at least some alphabetic content
        if (!preg_match('/[a-zA-Z]{3,}/', $prompt)) {
            return response()->json([
                'error' => 'Please describe your workout using words.',
            ], 422);
        }

        // ── Cache check ───────────────────────────────────────────────────────

        $cacheKey = 'ai_workout_' . hash('sha256', strtolower($prompt));

        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json(['workout' => $cached]);
        }

        // ── OpenAI call ───────────────────────────────────────────────────────

        $apiKey = config('services.openai.key');

        if (!$apiKey) {
            return response()->json(['error' => 'AI service not configured'], 503);
        }

        $system = <<<EOT
You are an expert personal trainer and workout designer. Generate a complete, professional workout plan based on the trainer's request.

Return ONLY a valid JSON object — no markdown, no code blocks, no explanation. Just raw JSON:
{
  "title": "Concise, descriptive workout name",
  "description": "2–3 sentence overview: purpose, target muscles, and key benefits",
  "workout_list": "6–10 exercises, one per line. Format: Sets x Reps Exercise Name (e.g. 3x10 Barbell Squats)",
  "difficulty": "Beginner or Intermediate or Advanced",
  "duration": 45
}

Make exercises specific, varied, and appropriate for the requested difficulty and goals.
EOT;

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type'  => 'application/json',
            ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
                'model'      => 'gpt-4o-mini',
                'max_tokens' => 1024,
                'messages'   => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user',   'content' => $prompt],
                ],
            ]);

            if (!$response->successful()) {
                return response()->json(['error' => 'AI generation failed'], 502);
            }

            $text = $response->json('choices.0.message.content', '');

            // Strip any accidental markdown fences
            $text = preg_replace('/```json\s*/i', '', $text);
            $text = preg_replace('/```\s*/i', '', $text);
            $text = trim($text);

            $workout = json_decode($text, true);

            if (!$workout || !isset($workout['title'])) {
                return response()->json(['error' => 'Failed to parse AI response'], 502);
            }

            $result = [
                'title'        => $workout['title'] ?? '',
                'description'  => $workout['description'] ?? '',
                'workout_list' => $workout['workout_list'] ?? '',
                'difficulty'   => $workout['difficulty'] ?? 'Intermediate',
                'duration'     => (int) ($workout['duration'] ?? 45),
            ];

            // ── Store in cache ─────────────────────────────────────────────────
            Cache::put($cacheKey, $result, self::CACHE_TTL_SECONDS);

            return response()->json(['workout' => $result]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'AI generation failed'], 502);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function sanitizePrompt(string $raw): string
    {
        // Strip HTML/script tags
        $clean = strip_tags($raw);

        // Decode HTML entities (e.g. &amp; → &)
        $clean = html_entity_decode($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Collapse all whitespace (tabs, newlines, multiple spaces) to single space
        $clean = preg_replace('/\s+/', ' ', $clean);

        // Remove non-printable / control characters
        $clean = preg_replace('/[\x00-\x1F\x7F]/u', '', $clean);

        return trim($clean);
    }
}
