import api from './api';

export const getTrainerStats = async () => {
    const response = await api.get('api/trainer/stats');
    return response.data;
};

export const getTrainerProfile = async (token) => {
    const response = await api.get('api/trainer/trainer-profile', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const updateTrainerProfile = async (id, trainerData) => {
    const response = await api.patch(`api/trainer/trainer-profile/${id}`, trainerData);
    return response.data;
};
