import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alfai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('alfai_token');
      localStorage.removeItem('alfai_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

// SaaS API
export const saasApi = {
  getPlans: () => api.get('/saas/plans'),
  getModules: () => api.get('/saas/modules'),
  checkSubdomain: (name) => api.get(`/saas/subdomain/${name}/available`),
  getBilling: (companyId) => api.get(`/saas/billing/${companyId}`)
};

// Subscription API
export const subscriptionApi = {
  getCurrent: () => api.get('/subscriptions/current'),
  upgrade: (planId, billingCycle) => api.post('/subscriptions/upgrade', { planId, billingCycle }),
  addModule: (moduleId, billingCycle) => api.post('/subscriptions/add-module', { moduleId, billingCycle }),
  removeModule: (moduleId) => api.delete(`/subscriptions/remove-module/${moduleId}`),
  getUsage: () => api.get('/subscriptions/usage'),
  getHistory: () => api.get('/subscriptions/history')
};

// Modules API
export const modulesApi = {
  getAll: () => api.get('/modules'),
  getAccessible: () => api.get('/modules/accessible'),
  checkAccess: (moduleId) => api.get(`/modules/${moduleId}/check`)
};

// Customers API
export const customersApi = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getOrders: (id) => api.get(`/customers/${id}/orders`)
};

// Products API
export const productsApi = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, quantity, type, reason) => api.put(`/products/${id}/stock`, { quantity, type, reason })
};

// Invoices API
export const invoicesApi = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  updateStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),
  addPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
  getStats: () => api.get('/invoices/stats/summary')
};

// POS API
export const posApi = {
  getOrders: () => api.get('/pos/orders'),
  getActiveOrders: () => api.get('/pos/orders/active'),
  getOrder: (id) => api.get(`/pos/orders/${id}`),
  createOrder: (data) => api.post('/pos/orders', data),
  addItems: (id, items) => api.post(`/pos/orders/${id}/items`, { items }),
  removeItem: (id, itemId) => api.delete(`/pos/orders/${id}/items/${itemId}`),
  closeOrder: (id, paymentMethod, discount) => api.post(`/pos/orders/${id}/close`, { paymentMethod, discount }),
  cancelOrder: (id, reason) => api.post(`/pos/orders/${id}/cancel`, { reason }),
  getStats: () => api.get('/pos/stats'),
  getTables: () => api.get('/pos/tables')
};

// Inventory API
export const inventoryApi = {
  getOverview: () => api.get('/inventory'),
  getMovements: () => api.get('/inventory/movements'),
  createAdjustment: (productId, quantity, type, reason) => 
    api.post('/inventory/adjustment', { productId, quantity, type, reason }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getValuation: () => api.get('/inventory/valuation')
};

// HR API
export const hrApi = {
  getEmployees: () => api.get('/hr/employees'),
  getEmployee: (id) => api.get(`/hr/employees/${id}`),
  createEmployee: (data) => api.post('/hr/employees', data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/hr/employees/${id}`),
  getDepartments: () => api.get('/hr/departments'),
  getStats: () => api.get('/hr/stats')
};

// Projects API
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addTask: (id, data) => api.post(`/projects/${id}/tasks`, data),
  updateTask: (id, taskId, data) => api.put(`/projects/${id}/tasks/${taskId}`, data),
  getStats: () => api.get('/projects/stats/summary')
};

// Reports API
export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSales: (params) => api.get('/reports/sales', { params }),
  getProducts: () => api.get('/reports/products'),
  getCustomers: () => api.get('/reports/customers')
};

// AI API
export const aiApi = {
  chat: (message) => api.post('/ai/chat', { message }),
  getCFOAnalysis: () => api.get('/ai/cfo-analysis'),
  getInsights: () => api.get('/ai/insights')
};

export default api;
