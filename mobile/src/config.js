/**
 * App-wide configuration.
 *
 * API_BASE_URL:
 *   - Local iOS simulator : http://localhost:8000
 *   - Local Android emulator: http://10.0.2.2:8000
 *   - Physical device on same network: http://<your-machine-LAN-IP>:8000
 *   - Production: https://api.yourdomain.com
 */
export const API_BASE_URL = 'http://localhost:8000';

// RapidAPI key for ExerciseDB — add your key to the backend .env as EXERCISE_DB_API_KEY
// The app calls the backend proxy at /api/trainer/exercise-library, not ExerciseDB directly.
