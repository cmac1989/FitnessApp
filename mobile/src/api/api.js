import axios from 'axios';

const api = axios.create({
    baseURL: 'https://fitnessapp-production-c2d0.up.railway.app',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
