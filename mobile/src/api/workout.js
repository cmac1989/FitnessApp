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
