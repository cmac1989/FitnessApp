<?php

namespace App\Http\Controllers;

use App\Models\ExerciseLibrary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ExerciseLibraryController extends Controller
{
    private function headers(): array
    {
        return [
            'x-rapidapi-key'  => env('EXERCISE_DB_API_KEY', ''),
            'x-rapidapi-host' => 'exercisedb.p.rapidapi.com',
        ];
    }

    /**
     * GET /api/trainer/exercise-library/body-parts
     * Returns the list of body parts from ExerciseDB.
     */
    public function bodyParts()
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(15)
            ->get('https://exercisedb.p.rapidapi.com/exercises/bodyPartList');

        if (!$response->ok()) {
            return response()->json(['error' => 'Could not fetch body parts from ExerciseDB.'], 502);
        }

        return response()->json($response->json());
    }

    /**
     * GET /api/trainer/exercise-library
     * Query params: bodyPart, name, limit (default 20), offset (default 0)
     * Proxies ExerciseDB and caches results in exercise_library table.
     */
    public function index(Request $request)
    {
        $bodyPart = $request->query('bodyPart');
        $name     = $request->query('name');
        $limit    = (int) $request->query('limit', 20);
        $offset   = (int) $request->query('offset', 0);

        $url = 'https://exercisedb.p.rapidapi.com/exercises';
        if ($bodyPart) {
            $url = 'https://exercisedb.p.rapidapi.com/exercises/bodyPart/' . urlencode($bodyPart);
        } elseif ($name) {
            $url = 'https://exercisedb.p.rapidapi.com/exercises/name/' . urlencode($name);
        }

        $response = Http::withHeaders($this->headers())
            ->timeout(15)
            ->get($url, ['limit' => $limit, 'offset' => $offset]);

        if (!$response->ok()) {
            return response()->json(['error' => 'Could not fetch exercises from ExerciseDB.'], 502);
        }

        $exercises = $response->json();

        // Cache exercises in the database (upsert by external_id)
        // Wrapped in try-catch so a missing table never causes a 500
        try {
            foreach ((array) $exercises as $ex) {
                if (empty($ex['id'])) continue;
                ExerciseLibrary::updateOrCreate(
                    ['external_id' => $ex['id']],
                    [
                        'name'              => $ex['name']      ?? '',
                        'body_part'         => $ex['bodyPart']  ?? '',
                        'equipment'         => $ex['equipment'] ?? '',
                        'target'            => $ex['target']    ?? '',
                        'gif_url'           => $ex['gifUrl']    ?? '',
                        'secondary_muscles' => $ex['secondaryMuscles'] ?? [],
                        'instructions'      => $ex['instructions']     ?? [],
                    ]
                );
            }
        } catch (\Exception $e) {
            // Table may not exist yet — data is still returned to the client
            \Log::warning('ExerciseLibrary cache failed: ' . $e->getMessage());
        }

        return response()->json($exercises);
    }
}
