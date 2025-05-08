import api from './api';

export const getClients = async () => {
    const response = await api.get('api/trainer/clients');
    return response.data;
};

export const getUserProfile = async (token) => {
    const response = await api.get('api/user', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

