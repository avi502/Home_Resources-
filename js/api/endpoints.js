// API Endpoint Definitions for HomeResource
import { apiClient } from './client.js';

export const api = {
  auth: {
    login: (email, password) => apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    register: (email, password, full_name) => apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name })
    }),
    getMe: () => apiClient('/auth/me')
  },

  households: {
    list: () => apiClient('/households'),
    get: (id) => apiClient(`/households/${id}`),
    update: (id, data) => apiClient(`/households/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  resources: {
    getDashboard: (householdId) => apiClient(`/resources/${householdId}/dashboard`),
    getEntries: (householdId, resourceType = null, limit = 50) => {
      const q = resourceType ? `?resource_type=${resourceType}&limit=${limit}` : `?limit=${limit}`;
      return apiClient(`/resources/${householdId}/entries${q}`);
    },
    addEntry: (householdId, data) => apiClient(`/resources/${householdId}/entries`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    deleteEntry: (householdId, entryId) => apiClient(`/resources/${householdId}/entries/${entryId}`, {
      method: 'DELETE'
    })
  },

  intelligence: {
    getBaseline: (householdId, resourceType) => apiClient(`/intelligence/${householdId}/baseline/${resourceType}`),
    getAnomalies: (householdId, resourceType, threshold = 2.0) => 
      apiClient(`/intelligence/${householdId}/anomalies/${resourceType}?threshold=${threshold}`),
    getRelationships: (householdId) => apiClient(`/intelligence/${householdId}/relationships`)
  },

  simulation: {
    getPresets: () => apiClient('/simulation/presets'),
    simulate: (householdId, requestData) => apiClient(`/simulation/${householdId}/simulate`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    })
  },

  export: {
    getJson: (householdId) => apiClient(`/export/${householdId}/json`),
    getCsv: (householdId) => apiClient(`/export/${householdId}/csv`),
    wipe: (householdId) => apiClient(`/export/${householdId}/wipe`, { method: 'POST' })
  }
};
