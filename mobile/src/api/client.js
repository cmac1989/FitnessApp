import api from './api';

export const getClientStats = async () => {
    const response = await api.get('api/client/stats');
    return response.data;
};

export const getClientSessions = async () => {
    const response = await api.get('api/client/sessions');
    return response.data;
};

export const getClientSession = async (id) => {
    const response = await api.get(`api/client/sessions/${id}`);
    return response.data;
};

export const getClientWorkouts = async () => {
    const response = await api.get('api/client/workouts');
    return response.data;
};

export const getClientWorkout = async (id) => {
    const response = await api.get(`api/client/workouts/${id}`);
    return response.data;
};

export const getClientProfile = async () => {
    const response = await api.get('api/client/profile');
    return response.data;
};

export const updateClientProfile = async (id, data) => {
    const response = await api.patch(`api/client/profile/${id}`, data);
    return response.data;
};
