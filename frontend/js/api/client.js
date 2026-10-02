// API Client with automatic JWT injection and standardized response handling
import { storage } from '../utils/storage.js';

const API_BASE = '/api/v1';

export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = storage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      console.warn('Session expired or unauthorized request.');
    }

    // Handle CSV or non-json responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return await response.text();
    }

    const payload = await response.json();

    if (!response.ok) {
      const errorMsg = payload.detail || payload.error || 'API Request Failed';
      throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }

    // StandardResponse has .data property
    return payload.data !== undefined ? payload.data : payload;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}
