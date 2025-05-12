import api from './api';

export const getAllSessions = async () => {
    const response = await api.get('api/trainer/training-sessions');
    return response.data;
};

export const createSession = async (sessionData) => {
    const response = await api.post('api/trainer/training-sessions', sessionData);
    return response.data;
};

export const updateSession = async (id, sessionData) => {
    const response = await api.patch(`api/trainer/training-sessions/${id}`, sessionData);
    return response.data;
};

export const deleteSession = async (id) => {
    const response = await api.delete(`/api/trainer/training-sessions/${id}`);
    return response.data;
};
