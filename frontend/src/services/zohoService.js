import api from './api';

export const zohoService = {
  async getAuthorizedServices() {
    const response = await api.get('/zoho/services');
    return response.data;
  },

  async getServiceData(service, action = 'overview') {
    const response = await api.get(`/zoho/${service}`, {
      params: { action },
    });
    return response.data;
  },

  async launchService(service) {
    const response = await api.get(`/zoho/${service}/launch`);
    return response.data;
  },

  async getIntegrationStatus() {
    const response = await api.get('/zoho/status');
    return response.data;
  },
};
