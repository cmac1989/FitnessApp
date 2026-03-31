/**
 * Module-level singleton for passing a selected exercise back to the caller
 * after navigating to ExerciseLibraryScreen in selection mode.
 *
 * Using a module variable avoids React Navigation's route-param serialization
 * limitations (functions can't be serialized) and prevents state-loss issues
 * caused by screen remounts.
 */

let _callback = null;

/** Called by the screen that wants to receive the exercise (e.g. CreateWorkoutScreen). */
export const registerExerciseCallback = (cb) => {
    _callback = cb;
};

/** Called when leaving the picker without selecting (cleanup). */
export const clearExerciseCallback = () => {
    _callback = null;
};

/** Called by ExerciseLibraryScreen once an exercise is confirmed. */
export const deliverExercise = (exercise) => {
    if (_callback) {
        _callback(exercise);
        _callback = null;
    }
};
