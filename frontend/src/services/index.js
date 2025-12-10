import api from './api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const contactsService = {
  getAll: async (params) => {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  }
};

export const dealsService = {
  getAll: async (params) => {
    const response = await api.get('/deals', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/deals', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/deals/${id}`, data);
    return response.data;
  },

  updateStage: async (id, stage, probability) => {
    const response = await api.put(`/deals/${id}/stage`, { stage, probability });
    return response.data;
  },

  markWon: async (id) => {
    const response = await api.post(`/deals/${id}/won`);
    return response.data;
  },

  markLost: async (id, reason) => {
    const response = await api.post(`/deals/${id}/lost`, { lost_reason: reason });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/deals/${id}`);
    return response.data;
  }
};

export const activitiesService = {
  getAll: async (params) => {
    const response = await api.get('/activities', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/activities/stats');
    return response.data;
  },

  getOverdue: async () => {
    const response = await api.get('/activities/overdue');
    return response.data;
  },

  getTeamMembers: async () => {
    const response = await api.get('/activities/team-members');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/activities', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/activities/${id}`, data);
    return response.data;
  },

  complete: async (id) => {
    const response = await api.put(`/activities/${id}/complete`);
    return response.data;
  },

  sendEmail: async (id) => {
    const response = await api.post(`/activities/${id}/send-email`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
  },

  // Checklist management
  updateChecklist: async (id, data) => {
    const response = await api.put(`/activities/${id}/checklist`, data);
    return response.data;
  },

  // Call logging
  logCall: async (data) => {
    const response = await api.post('/activities/log-call', data);
    return response.data;
  },

  // Meeting attendee status
  updateAttendeeStatus: async (id, data) => {
    const response = await api.put(`/activities/${id}/attendee-status`, data);
    return response.data;
  },

  // Support ticket actions
  escalateTicket: async (id, data) => {
    const response = await api.put(`/activities/${id}/escalate`, data);
    return response.data;
  },

  rateTicket: async (id, data) => {
    const response = await api.put(`/activities/${id}/rate`, data);
    return response.data;
  },

  // Reminder actions
  snoozeReminder: async (id, minutes) => {
    const response = await api.put(`/activities/${id}/snooze`, { snooze_minutes: minutes });
    return response.data;
  }
};

export const pipelinesService = {
  getAll: async () => {
    const response = await api.get('/pipelines');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/pipelines', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/pipelines/${id}`, data);
    return response.data;
  }
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};
