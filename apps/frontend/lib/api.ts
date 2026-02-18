import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register') ||
      error.config?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !isAuthRequest && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: { fullName: string; email: string; password: string; companyName: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
};

export const conversationsApi = {
  list: (filter = 'all', before?: string) =>
    api.get('/conversations', { params: { filter, before } }).then((r) => r.data),
  get: (id: string) => api.get(`/conversations/${id}`).then((r) => r.data),
  assign: (id: string, agentId: string) =>
    api.post(`/conversations/${id}/assign`, { agentId }).then((r) => r.data),
  markRead: (id: string) => api.post(`/conversations/${id}/read`).then((r) => r.data),
  resolve: (id: string) => api.post(`/conversations/${id}/resolve`).then((r) => r.data),
  reopen: (id: string) => api.post(`/conversations/${id}/reopen`).then((r) => r.data),
  updateTags: (id: string, tags: string[]) => api.patch(`/conversations/${id}/tags`, { tags }).then((r) => r.data),
};

export const messagesApi = {
  list: (conversationId: string, before?: string) =>
    api.get(`/conversations/${conversationId}/messages`, { params: { before } }).then((r) => r.data),
  send: (conversationId: string, content: string, contentType = 'text') =>
    api.post(`/conversations/${conversationId}/messages`, { content, contentType }).then((r) => r.data),
};

export const usersApi = {
  list: () => api.get('/users').then((r) => r.data),
  team: () => api.get('/users/team').then((r) => r.data),
  invite: (email: string, role = 'agent') =>
    api.post('/invitations', { email, role }).then((r) => r.data),
  updateProfile: (data: any) => api.patch('/users/me', data).then((r) => r.data),
};

export const invitationsApi = {
  get: (token: string) => api.get(`/invitations/${token}`).then((r) => r.data),
  accept: (token: string, data: any) => api.post(`/invitations/${token}/accept`, data).then((r) => r.data),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats').then((r) => r.data),
  getGrowthStats: (days?: number) => api.get('/admin/stats/growth', { params: { days } }).then((r) => r.data),
  getActivity: (limit?: number) => api.get('/admin/activity', { params: { limit } }).then((r) => r.data),

  // Empresas
  listCompanies: (params?: { q?: string; status?: string; plan?: string }) =>
    api.get('/admin/companies', { params }).then((r) => r.data),
  getCompany: (id: string) => api.get(`/admin/companies/${id}`).then((r) => r.data),
  createCompany: (data: any) => api.post('/admin/companies', data).then((r) => r.data),
  updateCompany: (id: string, data: any) => api.patch(`/admin/companies/${id}`, data).then((r) => r.data),
  suspendCompany: (id: string, reason?: string) => api.post(`/admin/companies/${id}/suspend`, { reason }).then((r) => r.data),
  activateCompany: (id: string) => api.post(`/admin/companies/${id}/activate`).then((r) => r.data),
  deleteCompany: (id: string) => api.delete(`/admin/companies/${id}`),

  // Usuários Globais
  listUsers: (q?: string, role?: string, status?: string) =>
    api.get('/admin/users', { params: { q, role, status } }).then((r) => r.data),
  createUser: (data: any) => api.post('/admin/users', data).then((r) => r.data),
  getUser: (id: string) => api.get(`/admin/users/${id}`).then((r) => r.data),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  resendAccess: (id: string) => api.post(`/admin/users/${id}/resend-access`).then((r) => r.data),
  impersonateUser: (id: string) => api.post(`/admin/users/${id}/impersonate`).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Planos
  listPlans: (all?: boolean) => api.get('/admin/plans', { params: { all: all ? 'true' : undefined } }).then((r) => r.data),
  createPlan: (data: any) => api.post('/admin/plans', data).then((r) => r.data),
  updatePlan: (id: string, data: any) => api.patch(`/admin/plans/${id}`, data).then((r) => r.data),
  deletePlan: (id: string) => api.delete(`/admin/plans/${id}`),
  setPlanFeatured: (id: string) => api.post(`/admin/plans/${id}/set-featured`).then((r) => r.data),
  seedPlans: () => api.post('/admin/plans/seed-defaults').then((r) => r.data),

  // Configurações Globais
  getSettings: () => api.get('/admin/settings').then((r) => r.data),
  updateSettings: (data: Record<string, any>) => api.patch('/admin/settings', data).then((r) => r.data),
  seedSettings: () => api.post('/admin/settings/seed').then((r) => r.data),

  // Platform Settings (nome, logo, favicon)
  getPlatformSettings: () => api.get('/admin/platform-settings').then((r) => r.data),
  updatePlatformSettings: (data: Record<string, any>) => api.patch('/admin/platform-settings', data).then((r) => r.data),

  // System Health
  getSystemHealth: () => api.get('/admin/system/health').then((r) => r.data),

  // Superadmin toggle
  toggleSuperadmin: (userId: string) => api.post(`/admin/users/${userId}/toggle-superadmin`).then((r) => r.data),
  exportCompaniesCSV: () => api.get('/admin/companies/export/csv', { responseType: 'blob' }),
  exportUsersCSV: () => api.get('/admin/users/export/csv', { responseType: 'blob' }),

  // WhatsApp Plans
  getWhatsAppPlans: () => api.get('/admin/whatsapp-plans').then((r) => r.data),
  updateWhatsAppPlans: (data: any) => api.patch('/admin/whatsapp-plans', data).then((r) => r.data),
};

export const channelsApi = {
  list: () => api.get('/channels').then((r) => r.data),
  create: (data: any) => api.post('/channels', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/channels/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/channels/${id}`),
  test: (id: string) => api.post(`/channels/${id}/test`).then((r) => r.data),
};

export const companyApi = {
  get: () => api.get('/companies/me').then((r) => r.data),
  updateMyCompany: (data: any) => api.patch('/companies/me', data).then((r) => r.data),
  updateSettings: (settings: Record<string, any>) =>
    api.patch('/companies/me/settings', settings).then((r) => r.data),
  updateWidgetConfig: (config: Record<string, any>) =>
    api.patch('/companies/me/widget-config', config).then((r) => r.data),
  getMembers: () => api.get('/companies/me/members').then((r) => r.data),
  updateMember: (id: string, data: any) => api.patch(`/companies/me/members/${id}`, data).then((r) => r.data),
  removeMember: (id: string) => api.delete(`/companies/me/members/${id}`).then((r) => r.data),
};

export const sectorsApi = {
  list: () => api.get('/sectors').then((r) => r.data),
  create: (data: any) => api.post('/sectors', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/sectors/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/sectors/${id}`).then((r) => r.data),
};

export const contactsApi = {
  list: (query?: string) => api.get('/contacts', { params: { q: query } }).then((r) => r.data),
  get: (id: string) => api.get(`/contacts/${id}`).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/contacts/${id}`, data).then((r) => r.data),
};

export const dashboardApi = {
  metrics: () => api.get('/dashboard/metrics').then((r) => r.data),
};

export const knowledgeBaseApi = {
  list: (category?: string, search?: string) =>
    api.get('/knowledge-base', { params: { category, q: search } }).then((r) => r.data),
  get: (id: string) => api.get(`/knowledge-base/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/knowledge-base', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/knowledge-base/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/knowledge-base/${id}`).then((r) => r.data),
};

export const quickRepliesApi = {
  list: (search?: string, scope?: string) =>
    api.get('/quick-replies', { params: { q: search, scope } }).then((r) => r.data),
  create: (data: any) => api.post('/quick-replies', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/quick-replies/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/quick-replies/${id}`).then((r) => r.data),
};

export const botFlowsApi = {
  list: () => api.get('/bot-flows').then((r) => r.data),
  get: (id: string) => api.get(`/bot-flows/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/bot-flows', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/bot-flows/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/bot-flows/${id}`).then((r) => r.data),
};

export const contactNotesApi = {
  list: (contactId: string) => api.get(`/contacts/${contactId}/notes`).then((r) => r.data),
  create: (contactId: string, content: string) =>
    api.post(`/contacts/${contactId}/notes`, { content }).then((r) => r.data),
  delete: (contactId: string, noteId: string) =>
    api.delete(`/contacts/${contactId}/notes/${noteId}`).then((r) => r.data),
};

export const whatsappQrApi = {
  getSessions: () => api.get('/whatsapp-qr/sessions').then((r) => r.data),
  getStatus: (channelId: string) => api.get(`/whatsapp-qr/${channelId}/status`).then((r) => r.data),
  connect: (channelId: string) => api.post(`/whatsapp-qr/${channelId}/connect`).then((r) => r.data),
  disconnect: (channelId: string) => api.delete(`/whatsapp-qr/${channelId}/disconnect`).then((r) => r.data),
};

export const aiApi = {
  getConfig: () => api.get('/ai/config').then((r) => r.data),
  saveConfig: (data: any) => api.post('/ai/config', data).then((r) => r.data),
  test: () => api.post('/ai/test').then((r) => r.data),
  suggest: (conversationId: string, messages: any[]) =>
    api.post('/ai/suggest', { conversationId, messages }).then((r) => r.data),
  chat: (messages: any[], useKB?: boolean) =>
    api.post('/ai/chat', { messages, useKB }).then((r) => r.data),
};

export const scheduleApi = {
  getMySchedule: () => api.get('/users/me/schedule').then((r) => r.data),
  saveMySchedule: (data: any) => api.patch('/users/me/schedule', data).then((r) => r.data),
  saveMemberSchedule: (memberId: string, data: any) =>
    api.patch(`/companies/me/members/${memberId}/schedule`, data).then((r) => r.data),
};

export const plansApi = {
  list: () => api.get('/plans').then((r) => r.data),
};

export const crmApi = {
  // Pipelines
  getPipelines: () => api.get('/crm/pipelines').then((r) => r.data),
  createPipeline: (data: any) => api.post('/crm/pipelines', data).then((r) => r.data),
  updatePipeline: (id: string, data: any) => api.patch(`/crm/pipelines/${id}`, data).then((r) => r.data),
  getOrCreateDefault: () => api.post('/crm/default-pipeline').then((r) => r.data),
  addLead: (data: any) => api.post('/crm/leads', data).then((r) => r.data),
  searchLeads: (q: string) => api.get('/crm/leads/search', { params: { q } }).then((r) => r.data),

  // Board & Stats
  getBoard: (pipelineId?: string) => api.get('/crm/board', { params: { pipelineId } }).then((r) => r.data),
  getStats: () => api.get('/crm/stats').then((r) => r.data),

  // Contact CRM operations
  moveContact: (contactId: string, stageId: string, pipelineId: string) =>
    api.patch(`/crm/contacts/${contactId}/move`, { stageId, pipelineId }).then((r) => r.data),
  updateContactCrm: (contactId: string, data: any) =>
    api.patch(`/crm/contacts/${contactId}`, data).then((r) => r.data),

  // Activities
  getActivities: (contactId: string) =>
    api.get(`/crm/contacts/${contactId}/activities`).then((r) => r.data),
  addActivity: (contactId: string, data: { type: string; content: string; metadata?: any }) =>
    api.post(`/crm/contacts/${contactId}/activities`, data).then((r) => r.data),

  // Tasks
  getTasks: (params?: { contactId?: string; assignedTo?: string }) =>
    api.get('/crm/tasks', { params }).then((r) => r.data),
  createTask: (data: any) => api.post('/crm/tasks', data).then((r) => r.data),
  updateTask: (id: string, data: any) => api.patch(`/crm/tasks/${id}`, data).then((r) => r.data),
  deleteTask: (id: string) => api.delete(`/crm/tasks/${id}`).then((r) => r.data),
};

export const automationsApi = {
  list: () => api.get('/automations').then((r) => r.data),
  get: (id: string) => api.get(`/automations/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/automations', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/automations/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/automations/${id}`).then((r) => r.data),
  toggle: (id: string) => api.post(`/automations/${id}/toggle`).then((r) => r.data),
  getLogs: (id: string) => api.get(`/automations/${id}/logs`).then((r) => r.data),
  getStats: () => api.get('/automations/stats').then((r) => r.data),
};

export const reportsApi = {
  getOverview: (period = '30d') => api.get('/reports/overview', { params: { period } }).then((r) => r.data),
  getConversationsByDay: (period = '30d') => api.get('/reports/conversations-by-day', { params: { period } }).then((r) => r.data),
  getAgentPerformance: (period = '30d') => api.get('/reports/agent-performance', { params: { period } }).then((r) => r.data),
  getChannels: (period = '30d') => api.get('/reports/channels', { params: { period } }).then((r) => r.data),
  getResponseTime: (period = '30d') => api.get('/reports/response-time', { params: { period } }).then((r) => r.data),
  getContactGrowth: (period = '30d') => api.get('/reports/contact-growth', { params: { period } }).then((r) => r.data),
  getCsat: (period = '30d') => api.get('/reports/csat', { params: { period } }).then((r) => r.data),
};
