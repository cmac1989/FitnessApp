import api from './api';

// ── Shared (client uses /client/schedule, trainer uses /trainer/schedule) ────

const basePath = (role) => role === 'trainer' ? 'api/trainer' : 'api/client';

export const getAssignment = async (role, id) => {
    const response = await api.get(`${basePath(role)}/schedule/${id}`);
    return response.data;
};

export const toggleLike = async (role, id) => {
    const response = await api.post(`${basePath(role)}/schedule/${id}/like`);
    return response.data;
};

export const getComments = async (role, id) => {
    const response = await api.get(`${basePath(role)}/schedule/${id}/comments`);
    return response.data;
};

export const addComment = async (role, id, body) => {
    const response = await api.post(`${basePath(role)}/schedule/${id}/comments`, { body });
    return response.data;
};

export const deleteComment = async (role, assignmentId, commentId) => {
    const response = await api.delete(`${basePath(role)}/schedule/${assignmentId}/comments/${commentId}`);
    return response.data;
};

export const toggleCommentLike = async (role, assignmentId, commentId) => {
    const response = await api.post(`${basePath(role)}/schedule/${assignmentId}/comments/${commentId}/like`);
    return response.data;
};

// ── Client only ───────────────────────────────────────────────────────────────

export const toggleComplete = async (id) => {
    const response = await api.patch(`api/client/schedule/${id}/complete`);
    return response.data;
};

// ── Trainer only ──────────────────────────────────────────────────────────────

export const getTrainerClientSchedule = async (clientId) => {
    const response = await api.get(`api/trainer/clients/${clientId}/schedule`);
    return response.data;
};
