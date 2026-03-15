import api from './api';

export const getUserNotifications = async () => {
    const response = await api.get('/api/trainer/notifications');
    return response.data;
};

export const getUnreadNotificationCount = async () => {
    const response = await api.get('/api/trainer/notifications/unread-count');
    return response.data;
};

export const markNotificationsAsRead = async () => {
    const response = await api.post('/api/trainer/notifications/mark-as-read');
    return response.data;
};
