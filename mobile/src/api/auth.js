import api from './api';

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
        console.error('error registering user', error.response?.data || error.message);
        throw error;
    }
};

export { registerUser, userLogin };
