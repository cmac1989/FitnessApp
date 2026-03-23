import api from './api';

export const getTrainerWorkouts = async () => {
    const response = await api.get('api/trainer/workouts');
    return response.data;
};

export const getTrainerWorkout = async (workoutId) => {
    const response = await api.get(`api/trainer/workouts/${workoutId}`);
    return response.data;
};
export const createWorkout = async (workoutData) => {
    const response = await api.post('api/trainer/workouts', workoutData);
    return response.data;
};

export const updateWorkout = async (id, workoutData) => {
    const response = await api.patch(`api/trainer/workouts/${id}`, workoutData);
    return response.data;
};

export const deleteWorkout = async (id) => {
    const response = await api.delete(`api/trainer/workouts/${id}`);
    return response.data;
};

export const assignWorkout = async (workoutId, clientId, scheduledDate = null) => {
    const response = await api.post(`api/trainer/workouts/${workoutId}/assign`, {
        client_id: clientId,
        scheduled_date: scheduledDate,
    });
    return response.data;
};

export const batchAssignWorkout = async (workoutId, clientIds, scheduledDate = null) => {
    const response = await api.post(`api/trainer/workouts/${workoutId}/assign-batch`, {
        client_ids: clientIds,
        scheduled_date: scheduledDate,
    });
    return response.data;
};

export const getClientSchedule = async () => {
    const response = await api.get('api/client/schedule');
    return response.data;
};

export const generateWorkout = async (prompt) => {
    const response = await api.post('api/trainer/workouts/generate', { prompt });
    return response.data;
};
