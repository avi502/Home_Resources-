// API Client with automatic JWT injection, auto-login for demo mode, and retry handling
import { storage } from '../utils/storage.js';

const API_BASE = '/api/v1';
let isLoggingIn = false;
let loginPromise = null;

export async function getDemoToken() {
  if (isLoggingIn) return loginPromise;
  isLoggingIn = true;
  loginPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@homeresource.local', password: 'Password123!' })
      });
      const payload = await res.json();
      if (payload && payload.data && payload.data.access_token) {
        storage.setToken(payload.data.access_token);
        storage.setUser({ full_name: 'Alex Rivera', email: 'demo@homeresource.local' });
        storage.setHouseholdId(payload.data.household_id || 1);
        return payload.data.access_token;
      }
    } catch (e) {
      console.warn('Automatic demo login failed:', e);
    } finally {
      isLoggingIn = false;
      loginPromise = null;
    }
    return null;
  })();
  return loginPromise;
}

export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  let token = storage.getToken();
  // If no token exists and this is not an auth route, fetch demo JWT automatically
  if (!token && !endpoint.includes('/auth/')) {
    token = await getDemoToken();
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    let response = await fetch(url, config);

    // If token expired or invalid, auto-refresh and retry once transparently
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      console.warn('Unauthorized or expired token. Refreshing demo credentials...');
      const newToken = await getDemoToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      }
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
