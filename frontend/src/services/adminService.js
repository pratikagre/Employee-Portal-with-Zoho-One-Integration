import api from './api';

export const adminService = {
  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async getUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  async getRoles() {
    const response = await api.get('/admin/roles');
    return response.data;
  },

  async updateRolePermissions(roleId, permissionIds) {
    const response = await api.put(`/admin/roles/${roleId}/permissions`, { permissionIds });
    return response.data;
  },

  async getPermissions() {
    const response = await api.get('/admin/permissions');
    return response.data;
  },

  async getAuditLogs(params = {}) {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },
};
