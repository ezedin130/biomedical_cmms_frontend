import { api } from './client.js';

// A thin, typed-ish surface over the REST API. Components import from here and
// never build URLs themselves, so a route change is a one-line edit.
export const authApi = {
  login: (body) => api.post('/auth/login', body).then((r) => r.data.data),
  refresh: () => api.post('/auth/refresh').then((r) => r.data.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me').then((r) => r.data.data),
  changePassword: (body) => api.post('/auth/change-password', body).then((r) => r.data),
};

export const workOrderApi = {
  list: (params) => api.get('/work-orders', { params }).then((r) => r.data),
  get: (id) => api.get(`/work-orders/${id}`).then((r) => r.data.data),
  create: (body) => api.post('/work-orders', body).then((r) => r.data.data),
  triage: (id, body) => api.patch(`/work-orders/${id}/triage`, body).then((r) => r.data.data),
  assign: (id, body) => api.patch(`/work-orders/${id}/assign`, body).then((r) => r.data.data),
  vendor: (id, body) => api.patch(`/work-orders/${id}/vendor`, body).then((r) => r.data.data),
  start: (id) => api.patch(`/work-orders/${id}/start`).then((r) => r.data.data),
  hold: (id, body) => api.patch(`/work-orders/${id}/hold`, body).then((r) => r.data.data),
  resume: (id) => api.patch(`/work-orders/${id}/resume`).then((r) => r.data.data),
  complete: (id, body) => api.patch(`/work-orders/${id}/complete`, body).then((r) => r.data.data),
  verify: (id, body) => api.patch(`/work-orders/${id}/verify`, body).then((r) => r.data.data),
};

export const equipmentApi = {
  list: (params) => api.get('/equipment', { params }).then((r) => r.data),
  get: (id) => api.get(`/equipment/${id}`).then((r) => r.data.data),
  create: (body) => api.post('/equipment', body).then((r) => r.data.data),
  approve: (id) => api.patch(`/equipment/${id}/approve`).then((r) => r.data.data),
  reject: (id) => api.delete(`/equipment/${id}`).then((r) => r.data.data),
  maintenanceDue: () => api.get('/equipment/maintenance-due').then((r) => r.data.items),
};

export const userApi = {
  list: () => api.get('/users').then((r) => r.data.items),
  technicians: () => api.get('/users/technicians').then((r) => r.data.items),
  create: (body) => api.post('/users', body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/users/${id}`, body).then((r) => r.data.data),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`).then((r) => r.data.data),
};

export const miscApi = {
  departments: () => api.get('/departments').then((r) => r.data.items),
  parts: (params) => api.get('/parts', { params }).then((r) => r.data.items),
  createPart: (body) => api.post('/parts', body).then((r) => r.data.data),
  approvePart: (id) => api.patch(`/parts/${id}/approve`).then((r) => r.data.data),
  rejectPart: (id) => api.delete(`/parts/${id}`).then((r) => r.data.data),
  receiveStock: (id, quantity) => api.post(`/parts/${id}/receive`, { quantity }).then((r) => r.data.data),
  dashboard: () => api.get('/dashboard').then((r) => r.data.data),
  costReport: () => api.get('/reports/cost').then((r) => r.data.items),
};

export const maintenanceApi = {
  list: (params) => api.get('/maintenance', { params }).then((r) => r.data.items),
  create: (body) => api.post('/maintenance', body).then((r) => r.data.data),
  assign: (id, assignedTo) => api.patch(`/maintenance/${id}/assign`, { assignedTo }).then((r) => r.data.data),
  complete: (id, body) => api.patch(`/maintenance/${id}/complete`, body).then((r) => r.data.data),
  approve: (id, body) => api.patch(`/maintenance/${id}/approve`, body).then((r) => r.data.data),
  cancel: (id) => api.patch(`/maintenance/${id}/cancel`).then((r) => r.data.data),
};

export const faultCategoryApi = {
  list: (params) => api.get('/fault-categories', { params }).then((r) => r.data.items),
  create: (body) => api.post('/fault-categories', body).then((r) => r.data.data),
  update: (id, body) => api.patch(`/fault-categories/${id}`, body).then((r) => r.data.data),
  remove: (id) => api.delete(`/fault-categories/${id}`).then((r) => r.data.data),
};
