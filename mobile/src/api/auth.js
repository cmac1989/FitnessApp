import api from './api';
import { removeToken, getToken } from '../services/authService';
import { API_BASE_URL } from '../config';

const registerUser = async (userData) => {
    try {
        const response = await api.post('/api/register', userData);
        console.log('User registered successfully:', response.data);
        return response.data;
    } catch(error) {
        const status = error.response?.status;
        const data = error.response?.data || {};

        console.log('error registering user', {
            status,
            message: data.message || error.message,
            errors: data.errors || null,
        });

        const formattedError = new Error(data.message || 'Registration failed. Please try again.');
        formattedError.status = status;
        formattedError.validationErrors = data.errors || null;
        formattedError.raw = data;

        throw formattedError;
    }
};

const userLogin = async (userData) => {
    try {
        const response = await api.post('api/login', userData);
        console.log('User logged in successfully', response.data);
        return response.data;
    } catch(error) {
        console.error('error logging in user', error.response?.data || error.message);
        throw error;
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

const forgotPassword = async (email) => {
    const response = await api.post('api/password/forgot', { email });
    return response.data;
};

const resetPassword = async (email, code, password, passwordConfirmation) => {
    const response = await api.post('api/password/reset', {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
    });
    return response.data;
};

const uploadAvatar = async (asset) => {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/user/avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            avatar_base64: asset.base64,
            avatar_type: asset.type || 'image/jpeg',
        }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
    }
    return response.json();
};

export { registerUser, userLogin, userLogout, forgotPassword, resetPassword, uploadAvatar };
