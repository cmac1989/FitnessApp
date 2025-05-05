import api from './api';
import {removeToken} from "../services/authService";

const registerUser = async (userData) => {
    try {
        const response = await api.post('/api/register', userData);
        console.log('User registered successfully:', response.data);
        return response.data;
    } catch(error) {
        console.log('error registering user', error.response?.data || error.message);
        throw error;
    }
};

const userLogin = async (userData) => {
    try {
        const response = await api.post('api/login', userData);
        console.log('User logged in successfully', response.data);
        return response.data;
    } catch(error) {
        console.error('error logging in user', error.response?.data || error.message);
    }
};

const userLogout = async () => {
    try {
        const response = await api.post('api/logout');
        await removeToken();
        return response.data;
    } catch(error) {
        console.error('error logging out user', error.response?.data || error.message);
    }
};

export { registerUser, userLogin, userLogout };
