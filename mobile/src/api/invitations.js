import api from './api';

// ── Trainer ─────────────────────────────────────────────────────────────────

export const sendInvitation = async (email) => {
    const response = await api.post('api/trainer/invitations', { email });
    return response.data;
};

export const getTrainerInvitations = async () => {
    const response = await api.get('api/trainer/invitations');
    return response.data;
};

export const cancelInvitation = async (id) => {
    const response = await api.delete(`api/trainer/invitations/${id}`);
    return response.data;
};

// ── Client ───────────────────────────────────────────────────────────────────

export const getPendingInvitations = async () => {
    const response = await api.get('api/client/invitations/pending');
    return response.data;
};

export const acceptInvitation = async (token) => {
    const response = await api.post(`api/client/invitations/${token}/accept`);
    return response.data;
};

export const declineInvitation = async (token) => {
    const response = await api.post(`api/client/invitations/${token}/decline`);
    return response.data;
};
