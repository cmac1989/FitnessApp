import api from './api';

export const getClientStats = async () => {
    const response = await api.get('api/client/stats');
    return response.data;
};
