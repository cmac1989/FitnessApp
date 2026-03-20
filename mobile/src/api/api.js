import axios from 'axios';
import {getToken} from '../services/authService';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 5000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const { removeToken } = await import('../services/authService');
            await removeToken();
        }
        return Promise.reject(error);
    }
);

export default api;
