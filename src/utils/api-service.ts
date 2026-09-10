// ══════════════════════════════════════════════════════════════════════════
// API SERVICE - Complete Backend Integration
// All endpoints for Admin Dashboard
// ══════════════════════════════════════════════════════════════════════════

import axios from 'axios';
// import { createBrowserHistory } from 'history';
// const history = createBrowserHistory();

// Create axios instance with base configuration
const currentUrl = window.location.href;
const URL = currentUrl.includes('admin-git-development-uptipros-projects') ? 'https://buyops-backend-development.up.railway.app/' : currentUrl.includes('localhost') ? 'http://localhost:8080' : import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('Missing refresh token');
        }
        const response = await refreshClient.post(
          '/auth/refresh',
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('buyops_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (window.location.pathname !== '/sign-in') {
          window.location.href = '/sign-in?reason=session-expired';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ══════════════════════════════════════════════════════════════════════════
// AUTH API
// ══════════════════════════════════════════════════════════════════════════

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  setup2FA: async () => {
    const response = await api.post('/auth/2fa/setup');
    return response.data; // { secret, qrCode }
  },

  enable2FA: async (token: string) => {
    const response = await api.post('/auth/2fa/enable', { token });
    return response.data;
  },

  disable2FA: async (token: string) => {
    const response = await api.post('/auth/2fa/disable', { token });
    return response.data;
  },

  verify2FA: async (interimToken: string, token: string) => {
    const response = await api.post('/auth/2fa/verify', { interimToken, token });
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD API
// ══════════════════════════════════════════════════════════════════════════

export const dashboardApi = {
  getOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  getRecentTransactions: async () => {
    const response = await api.get('/dashboard/recent-transactions');
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// COMPANIES API
// ══════════════════════════════════════════════════════════════════════════

export const companiesApi = {
  getAll: async (filters?: any) => {
    const response = await api.get('/companies', { params: filters });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },

  updateStats: async (id: string) => {
    const response = await api.post(`/companies/${id}/stats`);
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// ASSETS API
// ══════════════════════════════════════════════════════════════════════════

export const assetsApi = {
  getAll: async (filters?: any) => (await api.get("/assets", { params: filters })).data,
  getById: async (id: string) => (await api.get(`/assets/${id}`)).data,
  create: async (data: any) => (await api.post("/assets", data)).data,
  update: async (id: string, data: any) => (await api.put(`/assets/${id}`, data)).data,
  delete: async (id: string) => (await api.delete(`/assets/${id}`)).data,
  publish: async (id: string) => (await api.put(`/assets/${id}/publish`)).data,
  unpublish: async (id: string) => (await api.put(`/assets/${id}/unpublish`)).data,
  uploadImages: async (id: string, formData: FormData) =>
    (await api.post(`/assets/${id}/images/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })).data,
  uploadDocuments: async (id: string, formData: FormData) =>
    (await api.post(`/assets/${id}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })).data,
  addImage: async (id: string, imageData: { url: string; caption?: string }) =>
    (await api.post(`/assets/${id}/images`, imageData)).data,
  deleteImage: async (assetId: string, imageId: string) =>
    (await api.delete(`/assets/${assetId}/images/${imageId}`)).data,
  addDocument: async (id: string, documentData: { url: string; name: string; type: string }) =>
    (await api.post(`/assets/${id}/documents`, documentData)).data,
  deleteDocument: async (assetId: string, documentId: string) =>
    (await api.delete(`/assets/${assetId}/documents/${documentId}`)).data,
  // Search assets by name or id (server-side filtering)
  getBySearch: async (query: { name?: string; id?: string }) =>
    (await api.get("/assets", { params: query })).data,
};

// ══════════════════════════════════════════════════════════════════════════
// TRANSACTIONS API
// ══════════════════════════════════════════════════════════════════════════

export const transactionsApi = {
  getAll: async (filters?: any) => {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/transactions/stats');
    return response.data;
  },

  getUnpaidCommissions: async (month?: string) => {
    const response = await api.get('/transactions/commissions/unpaid', { params: { month } });
    return response.data;
  },

  getPaidCommissions: async (month?: string) => {
    const response = await api.get('/transactions/commissions/paid', { params: { month } });
    return response.data;
  },

  sendCommissions: async (transactionIds: string[]) => {
    const response = await api.post('/transactions/commissions/send', { transactionIds });
    return response.data;
  },

  uploadPaymentProof: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/transactions/commissions/payment-proof', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// COMMISSIONS API
// Commission data lives under /transactions/commissions/...
// There is no standalone /commissions controller on the backend.
// ══════════════════════════════════════════════════════════════════════════

export const commissionsApi = {
  getSummary: async () => {
    // Derived from transaction stats — no dedicated summary endpoint
    const response = await api.get('/transactions/stats');
    return response.data;
  },

  getUnpaid: async (month?: string) => {
    const response = await api.get('/transactions/commissions/unpaid', { params: month ? { month } : {} });
    return response.data;
  },

  getPaid: async (month?: string) => {
    const response = await api.get('/transactions/commissions/paid', { params: month ? { month } : {} });
    return response.data;
  },

  markAsPaid: async (transactionIds: string[]) => {
    // Backend marks commissions paid via POST /transactions/commissions/send
    const response = await api.post('/transactions/commissions/send', { transactionIds });
    return response.data;
  },

  getByTransaction: async (transactionId: string) => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// INSTALLMENTS API
// ══════════════════════════════════════════════════════════════════════════

export const installmentsApi = {
  getAll: async (status?: string) => {
    const response = await api.get('/installments', { params: { status } });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/installments/${id}`);
    return response.data;
  },

  getSchedule: async (id: string) => {
    const response = await api.get(`/installments/${id}/schedule`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/installments', data);
    return response.data;
  },

  recordPayment: async (planId: string, installmentId: string, data: { amount: number; paymentMethod: string }) => {
    const response = await api.put(`/installments/${planId}/installments/${installmentId}/pay`, data);
    return response.data;
  },

  sendReminder: async (data: { installmentId: string; reminderDate: string; method: string }) => {
    const response = await api.post('/installments/reminders/send', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/installments/stats');
    return response.data;
  },

  getUpcoming: async () => {
    const response = await api.get('/installments/upcoming');
    return response.data;
  },

  getOverdue: async () => {
    const response = await api.get('/installments/overdue');
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// PAYMENTS API
// ══════════════════════════════════════════════════════════════════════════

export const paymentsApi = {
  getProviders: async () => {
    const response = await api.get('/payments/providers');
    return response.data;
  },

  initialize: async (data: {
    provider: 'paystack' | 'flutterwave';
    email: string;
    amount: number;
    currency?: string;
    callbackUrl?: string;
    reference?: string;
    metadata?: Record<string, any>;
    title?: string;
  }) => {
    const response = await api.post('/payments/initialize', data);
    return response.data;
  },

  verify: async (provider: 'paystack' | 'flutterwave', reference: string) => {
    const response = await api.get('/payments/verify', {
      params: { provider, reference },
    });
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// LEADS API
// ══════════════════════════════════════════════════════════════════════════

export const leadsApi = {
  getAll: async (filters?: any) => {
    const response = await api.get('/leads', { params: filters });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/leads', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  assign: async (id: string, clusterId: string) => {
    const response = await api.post(`/leads/${id}/assign`, { clusterId });
    return response.data;
  },

  assignBulk: async (leadIds: string[], assignmentType: 'cluster' | 'all', clusterId?: string) => {
    const response = await api.post('/leads/assign', { leadIds, assignmentType, clusterId });
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/leads/${id}/status`, { status });
    return response.data;
  },

  bulkImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/leads/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// USERS API
// ══════════════════════════════════════════════════════════════════════════

export const usersApi = {
  getAll: async (params?: { role?: string; status?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const response = await api.get(`/users${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getUserStats: async (id: string) => {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  },

  deactivate: async (id: string) => {
    const response = await api.post(`/users/${id}/deactivate`);
    return response.data;
  },

  reactivate: async (id: string) => {
    const response = await api.post(`/users/${id}/reactivate`);
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// AGENTS API
// ══════════════════════════════════════════════════════════════════════════

export const agentsApi = {
  getAll: async () => {
    const response = await api.get('/agents');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/agents', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/agents/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/agents/${id}`);
    return response.data;
  },

  getStats: async () => {
    // GET /agents/stats — aggregate stats for all agents
    const response = await api.get('/agents/stats');
    return response.data;
  },

  getPerformance: async (id: string) => {
    // No per-agent performance endpoint — fetch agent profile + report data
    const [agentRes, reportRes] = await Promise.all([
      api.get(`/agents/${id}`),
      api.get('/reports/agents'),
    ]);
    const agentData = agentRes.data;
    const reportData = reportRes.data?.data || [];
    const agentReport = Array.isArray(reportData)
      ? reportData.find((a: any) => a.id === id || a.agentId === id)
      : null;
    return { ...agentData, performance: agentReport || null };
  },
};

// ══════════════════════════════════════════════════════════════════════════
// CLUSTERS API
// ══════════════════════════════════════════════════════════════════════════

export const clustersApi = {
  getAll: async () => {
    const response = await api.get('/clusters');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/clusters/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/clusters', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/clusters/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/clusters/${id}`);
    return response.data;
  },

  addAgent: async (clusterId: string, agentId: string) => {
    const response = await api.post(`/clusters/${clusterId}/agents`, { agentId });
    return response.data;
  },

  removeAgent: async (clusterId: string, agentId: string) => {
    const response = await api.delete(`/clusters/${clusterId}/agents/${agentId}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/clusters/stats');
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// FREELANCERS API
// ══════════════════════════════════════════════════════════════════════════

export const freelancersApi = {
  getAll: async () => {
    const response = await api.get('/freelancers');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/freelancers/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/freelancers', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/freelancers/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/freelancers/${id}`);
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS API
// ══════════════════════════════════════════════════════════════════════════

export const notificationsApi = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getUnread: async () => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════
// REPORTS API
// ══════════════════════════════════════════════════════════════════════════

export const reportsApi = {
  getSalesReport: async (params?: any) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },

  getAssetReport: async (params?: any) => {
    const response = await api.get('/reports/assets', { params });
    return response.data;
  },

  getInvestmentReports: async (params?: any) => {
    const response = await api.get('/reports/investments', { params });
    return response.data;
  },

  getCommissionReports: async (params?: any) => {
    const response = await api.get('/reports/commissions', { params });
    return response.data;
  },

  getPerformanceReports: async (params?: any) => {
    const response = await api.get('/reports/performance', { params });
    return response.data;
  },

  exportReport: async (type: 'sales' | 'agents' | 'clusters', params?: any) => {
    const response = await api.get('/reports/export', {
      params: { ...params, type },
      responseType: 'blob'
    });
    return response.data;
  },
};

// ── Free Invoice API ──────────────────────────────────────────────────────────
const invoiceApi = axios.create({
  baseURL: import.meta.env.VITE_INVOICE_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

export const invoicesApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const response = await invoiceApi.get('/api/invoices', { params });
    return response.data as { invoices: any[]; total: number };
  },
};

/**
 * Resolves a media URL so it works regardless of where it was stored.
 * Replaces localhost origin with the configured VITE_API_URL.
 */
export const resolveMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const apiBase = (URL).replace(/\/$/, '');
  // Already using the correct origin
  if (url.startsWith(apiBase)) return url;
  // Relative path — prepend API base
  if (url.startsWith('/')) return `${apiBase}${url}`;
  // Stored with an old localhost URL — swap the origin
  if (/^https?:\/\/localhost(:\d+)?/.test(url)) {
    return url.replace(/^https?:\/\/localhost(:\d+)?/, apiBase);
  }
  return url;
};
