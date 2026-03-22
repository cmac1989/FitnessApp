import api from './api';

// ── Dashboard ──────────────────────────────────────────────────────────────

export const getClientDashboard = async () => {
    const response = await api.get('api/client/dashboard');
    return response.data;
};

// kept for any legacy usage
export const getClientStats = async () => {
    const response = await api.get('api/client/stats');
    return response.data;
};

// ── Sessions ───────────────────────────────────────────────────────────────

export const getClientSessions = async () => {
    const response = await api.get('api/client/sessions');
    return response.data;
};

export const getClientSession = async (id) => {
    const response = await api.get(`api/client/sessions/${id}`);
    return response.data;
};

// ── Workouts ───────────────────────────────────────────────────────────────

export const getClientWorkouts = async () => {
    const response = await api.get('api/client/workouts');
    return response.data;
};

export const getClientWorkout = async (id) => {
    const response = await api.get(`api/client/workouts/${id}`);
    return response.data;
};

// ── Profile ────────────────────────────────────────────────────────────────

export const getClientProfile = async () => {
    const response = await api.get('api/client/profile');
    return response.data;
};

export const updateClientProfile = async (data) => {
    const response = await api.patch('api/client/profile', data);
    return response.data;
};

// ── Goals ──────────────────────────────────────────────────────────────────

export const getClientGoal = async () => {
    const response = await api.get('api/client/goal');
    return response.data;
};

export const setClientGoal = async (data) => {
    const response = await api.post('api/client/goal', data);
    return response.data;
};

export const updateClientGoal = async (id, data) => {
    const response = await api.patch(`api/client/goal/${id}`, data);
    return response.data;
};

// ── Metrics ────────────────────────────────────────────────────────────────

export const logClientMetric = async (data) => {
    const response = await api.post('api/client/metrics', data);
    return response.data;
};

export const getClientMetrics = async (type, limit = 30) => {
    const response = await api.get(`api/client/metrics/${type}`, { params: { limit } });
    return response.data;
};

// ── Messages ───────────────────────────────────────────────────────────────

export const getClientConversations = async () => {
    const response = await api.get('api/client/messages/conversations');
    return response.data;
};

export const getClientMessagesWithUser = async (otherUserId) => {
    const response = await api.get(`api/client/messages/${otherUserId}`);
    return response.data;
};

export const sendClientMessage = async (receiverId, content) => {
    const response = await api.post('api/client/messages', { receiver_id: receiverId, content });
    return response.data;
};

export const markClientMessagesAsRead = async () => {
    const response = await api.post('api/client/messages/mark-as-read');
    return response.data;
};

// ── Notifications ──────────────────────────────────────────────────────────

export const getClientNotifications = async () => {
    const response = await api.get('api/client/notifications');
    return response.data;
};

export const markClientNotificationsAsRead = async () => {
    const response = await api.post('api/client/notifications/mark-as-read');
    return response.data;
};
