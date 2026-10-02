// API Client with automatic JWT injection, static hosting fallback for GitHub Pages, and retry handling
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
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const payload = await res.json();
        if (payload && payload.data && payload.data.access_token) {
          storage.setToken(payload.data.access_token);
          storage.setUser({ full_name: 'Alex Rivera', email: 'demo@homeresource.local' });
          storage.setHouseholdId(payload.data.household_id || 1);
          return payload.data.access_token;
        }
      }
    } catch (e) {
      console.warn('API backend offline or static environment detected:', e.message);
    } finally {
      isLoggingIn = false;
      loginPromise = null;
    }

    // Static GitHub Pages / Offline fallback token
    const fallbackToken = 'demo-guest-token-2026';
    storage.setToken(fallbackToken);
    storage.setUser({ full_name: 'Alex Rivera', email: 'demo@homeresource.io' });
    storage.setHouseholdId(1);
    return fallbackToken;
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

    // Detect static host (e.g. GitHub Pages returns 404 HTML page instead of API JSON)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || response.status === 404) {
      console.warn(`[Static Host Detected] Endpoint ${endpoint} returned HTML/404, using demo fallback data.`);
      return getStaticMockFallback(endpoint, options);
    }

    // If token expired, auto-refresh once
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const newToken = await getDemoToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    // Handle CSV or non-json responses
    if (contentType.includes('text/csv')) {
      return await response.text();
    }

    const payload = await response.json();

    if (!response.ok) {
      const errorMsg = payload.detail || payload.error || 'API Request Failed';
      throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }

    return payload.data !== undefined ? payload.data : payload;
  } catch (err) {
    console.warn(`[API Offline Fallback] ${endpoint}:`, err.message);
    const mock = getStaticMockFallback(endpoint, options);
    if (mock !== null && mock !== undefined) {
      return mock;
    }
    throw err;
  }
}

// Full rich mock dataset for GitHub Pages & static/offline deployments
function getStaticMockFallback(endpoint, options = {}) {
  // Auth Login & Register
  if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
    return {
      access_token: 'demo-static-jwt-token',
      token_type: 'bearer',
      user: { id: 1, email: 'demo@homeresource.io', full_name: 'Alex Rivera' },
      household_id: 1
    };
  }

  // Dashboard route
  if (endpoint.includes('/dashboard')) {
    const today = new Date();
    const entries = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      entries.push(
        { id: 100 + i * 4, resource_type: 'electricity', amount: Number((4.6 + (i % 3) * 0.4).toFixed(1)), unit: 'kWh', recorded_at: dateStr + 'T18:00:00Z', notes: 'Evening telemetry' },
        { id: 101 + i * 4, resource_type: 'water', amount: Math.round(310 + (i % 4) * 22), unit: 'L', recorded_at: dateStr + 'T19:30:00Z', notes: 'Daily consumption' },
        { id: 102 + i * 4, resource_type: 'food', amount: Number((1.8 + (i % 2) * 0.4).toFixed(1)), unit: 'kg', recorded_at: dateStr + 'T20:00:00Z', notes: 'Compost & pantry' },
        { id: 103 + i * 4, resource_type: 'money', amount: Number((12.50 + (i % 5) * 2.2).toFixed(2)), unit: 'USD', recorded_at: dateStr + 'T21:00:00Z', notes: 'Utility cost estimate' }
      );
    }
    return {
      household_id: 1,
      household_name: 'Emerald Haven Eco-Home',
      currency: 'USD',
      summaries: [
        { resource_type: 'electricity', total_amount: 18.4, daily_average: 5.1, unit: 'kWh', estimated_cost: 3.31 },
        { resource_type: 'water', total_amount: 328, daily_average: 345, unit: 'L', estimated_cost: 1.31 },
        { resource_type: 'food', total_amount: 2.3, daily_average: 2.1, unit: 'kg', estimated_cost: 0 },
        { resource_type: 'money', total_amount: 42.80, daily_average: 14.50, unit: 'USD', estimated_cost: 42.80 },
        { resource_type: 'time', total_amount: 3.2, daily_average: 1.5, unit: 'hrs', estimated_cost: 0 }
      ],
      recent_entries: entries
    };
  }

  // Anomalies
  if (endpoint.includes('/anomalies')) {
    return [
      {
        id: 1,
        resource_type: 'electricity',
        z_score: 2.85,
        anomaly_score: 0.92,
        detected_at: new Date().toISOString(),
        severity: 'high',
        explanation: 'Electricity spike of 8.2 kWh detected. 64% above baseline, correlated with water pump runtime.'
      },
      {
        id: 2,
        resource_type: 'water',
        z_score: 2.15,
        anomaly_score: 0.78,
        detected_at: new Date(Date.now() - 86400000).toISOString(),
        severity: 'medium',
        explanation: 'Water consumption peaked at 480 L during garden irrigation cycle.'
      }
    ];
  }

  // Connections Graph
  if (endpoint.includes('/relationships')) {
    return {
      nodes: [
        { id: 'electricity', label: 'Electricity', group: 'energy', value: 18.4, unit: 'kWh' },
        { id: 'water', label: 'Water', group: 'water', value: 328, unit: 'L' },
        { id: 'pump', label: 'Water Pump', group: 'equipment', value: 2.4, unit: 'hrs' },
        { id: 'solar', label: 'Solar Array', group: 'generation', value: 3.8, unit: 'kW' },
        { id: 'battery', label: 'Home Battery', group: 'storage', value: 82, unit: '%' }
      ],
      edges: [
        { source: 'water', target: 'pump', correlation: 0.94, weight: 3 },
        { source: 'pump', target: 'electricity', correlation: 0.88, weight: 3 },
        { source: 'solar', target: 'battery', correlation: 0.91, weight: 2 },
        { source: 'battery', target: 'electricity', correlation: 0.75, weight: 2 }
      ]
    };
  }

  // Simulation
  if (endpoint.includes('/simulation')) {
    return {
      projected_monthly_savings: 42.80,
      annual_savings: 513.60,
      electricity_saved_kwh: 48.5,
      water_saved_l: 1420,
      co2_avoided_kg: 32.1,
      recommendations: [
        'Shift pool/water pump schedules to peak solar generation hours (11 AM – 3 PM).',
        'Install low-flow aerators on kitchen & shower faucets to save 12% water.',
        'Utilize home battery discharge during evening peak tariff window.'
      ]
    };
  }

  // Entries CRUD
  if (endpoint.includes('/entries')) {
    return { id: Math.floor(Math.random() * 9000) + 1000, status: 'created', message: 'Logged successfully in demo environment.' };
  }

  return {};
}
