import api from './api';

/**
 * Facebook Service - All Facebook-specific API calls
 */

const facebookService = {
  // =====================
  // PAGES
  // =====================
  getPages: async () => {
    const response = await api.get('/facebook/pages');
    return response.data;
  },

  connectPage: async (data) => {
    const response = await api.post('/facebook/pages/connect', data);
    return response.data;
  },

  syncPage: async (id) => {
    const response = await api.post(`/facebook/pages/${id}/sync`);
    return response.data;
  },

  disconnectPage: async (id) => {
    const response = await api.delete(`/facebook/pages/${id}`);
    return response.data;
  },

  // =====================
  // MESSAGES (Messenger)
  // =====================
  getMessages: async (params) => {
    const response = await api.get('/facebook/messages', { params });
    return response.data;
  },

  sendMessage: async (data) => {
    const response = await api.post('/facebook/messages/send', data);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/facebook/messages/${id}/read`);
    return response.data;
  },

  assignConversation: async (conversationId, userId) => {
    const response = await api.put(`/facebook/messages/conversation/${conversationId}/assign`, { userId });
    return response.data;
  },

  // =====================
  // LEADS
  // =====================
  getLeads: async (params) => {
    const response = await api.get('/facebook/leads', { params });
    return response.data;
  },

  syncLeads: async (data) => {
    const response = await api.post('/facebook/leads/sync', data);
    return response.data;
  },

  convertLead: async (id, data) => {
    const response = await api.post(`/facebook/leads/${id}/convert`, data);
    return response.data;
  },

  updateLeadStatus: async (id, data) => {
    const response = await api.put(`/facebook/leads/${id}/status`, data);
    return response.data;
  },
};

export default facebookService;
