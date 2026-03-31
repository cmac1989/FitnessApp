import api from './api';

export const getPrograms = async () => {
    const response = await api.get('api/trainer/programs');
    return response.data; // array with workouts_count
};

export const getProgram = async (id) => {
    const response = await api.get(`api/trainer/programs/${id}`);
    return response.data; // program with workouts[]
};

export const createProgram = async (data) => {
    // data: { title, description?, workout_ids? }
    const response = await api.post('api/trainer/programs', data);
    return response.data;
};

export const updateProgram = async (id, data) => {
    // data: { title?, description?, workout_ids? }
    const response = await api.patch(`api/trainer/programs/${id}`, data);
    return response.data;
};

export const deleteProgram = async (id) => {
    const response = await api.delete(`api/trainer/programs/${id}`);
    return response.data;
};

export const batchAssignProgram = async (programId, clientIds, startDate = null) => {
    const response = await api.post(`api/trainer/programs/${programId}/assign-batch`, {
        client_ids: clientIds,
        start_date: startDate,
    });
    return response.data;
};
