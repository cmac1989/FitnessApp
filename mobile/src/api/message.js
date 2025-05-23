import api from './api';

export const fetchMessagesWithUser = async (otherId) => {
    const response = await api.get(`/api/trainer/messages/${otherId}`);
    return response.data;
};

export const getUnreadMessageCount = async () => {
    const response = await api.get('/api/trainer/messages/unread-count');
    return response.data;
};

export const fetchConversations = async () => {
    const response = await api.get('/api/trainer/messages/conversations');
    return response.data;
};

export const sendMessage = async (messageData) => {
    const response = await api.post('/api/trainer/messages', messageData);
    return response.data;
};

export const markMessageAsRead = async () => {
    const response = await api.post('/api/trainer/messages/mark-as-read');
    return response.data;
};
