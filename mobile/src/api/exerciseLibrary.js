import api from './api';

/**
 * Returns the list of body parts from ExerciseDB (via backend proxy).
 * e.g. ['back', 'chest', 'lower arms', ...]
 */
export const getBodyParts = async () => {
    const response = await api.get('api/trainer/exercise-library/body-parts');
    return response.data;
};

/**
 * Search / browse exercises through the backend proxy.
 * @param {object} opts
 * @param {string?} opts.bodyPart  - filter by body part
 * @param {string?} opts.name      - fuzzy search by exercise name
 * @param {number}  opts.limit     - page size (default 20)
 * @param {number}  opts.offset    - pagination offset (default 0)
 */
export const searchExercises = async ({ bodyPart = null, name = null, limit = 20, offset = 0 } = {}) => {
    const params = { limit, offset };
    if (bodyPart) params.bodyPart = bodyPart;
    if (name)     params.name     = name;
    const response = await api.get('api/trainer/exercise-library', { params });
    return response.data;
};
