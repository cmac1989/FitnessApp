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

export default registerUser;
