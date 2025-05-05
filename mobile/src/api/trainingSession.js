import api from './api';

export const getAllSessions = async () => {
    const response = await api.get('api/trainer/training-sessions');
    return response.data;
};

export const createSession = async (sessionData) => {
    const response = await api.post('api/trainer/create-training-session', sessionData);
    return response.data;
};
