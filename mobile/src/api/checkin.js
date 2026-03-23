import api from './api';

export const getClientCheckIns = async () => {
    const response = await api.get('/api/client/check-ins');
    return response.data;
};

export const submitCheckIn = async (data) => {
    const response = await api.post('/api/client/check-ins', data);
    return response.data;
};

export const getClientCheckIn = async (id) => {
    const response = await api.get(`/api/client/check-ins/${id}`);
    return response.data;
};

export const getTrainerCheckIns = async (clientId = null) => {
    const params = {};
    if (clientId !== null) {
        params.client_id = clientId;
    }
    const response = await api.get('/api/trainer/check-ins', { params });
    return response.data;
};

export const getTrainerCheckIn = async (id) => {
    const response = await api.get(`/api/trainer/check-ins/${id}`);
    return response.data;
};

export const reviewCheckIn = async (id, data) => {
    const response = await api.patch(`/api/trainer/check-ins/${id}/review`, data);
    return response.data;
};

export const trainerCreateCheckIn = async (data) => {
    const response = await api.post('/api/trainer/check-ins', data);
    return response.data;
};

export const clientCompleteCheckIn = async (id, data) => {
    const response = await api.patch(`/api/client/check-ins/${id}/complete`, data);
    return response.data;
};

export const trainerBatchCreateCheckIns = async (clientIds) => {
    const response = await api.post('/api/trainer/check-ins/batch', { client_ids: clientIds });
    return response.data;
};
