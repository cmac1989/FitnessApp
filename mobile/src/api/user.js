import api from './api';

export const getClients = async () => {
    const response = await api.get('api/trainer/clients');
    return response.data;
}
