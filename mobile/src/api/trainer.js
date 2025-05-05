import api from './api';

export const getTrainerStats = async () => {
    const response = await api.get('api/trainer/stats');
    return response.data;
};
