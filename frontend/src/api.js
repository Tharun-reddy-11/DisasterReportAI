// In development, Vite forwards /api requests to Spring Boot.
const API = import.meta.env.VITE_API_URL || '';

export const session = {
  get: () => JSON.parse(localStorage.getItem('drai-session') || 'null'),
  set: (v) => localStorage.setItem('drai-session', JSON.stringify(v)),
  clear: () => localStorage.removeItem('drai-session'),
};

async function call(path, { body, method = 'GET', auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = session.get()?.token;
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const r = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data.message || `Request could not be completed (HTTP ${r.status}).`);
  }
  return data;
}

export const api = {
  health: () => call('/api/health', { auth: false }),
  login: (body) => call('/api/auth/login', { method: 'POST', body, auth: false }),
  register: (body) => call('/api/auth/register', { method: 'POST', body, auth: false }),

  // Citizen report APIs
  reports: () => call('/api/reports'),
  summary: () => call('/api/reports/summary'),
  createReport: (body) => call('/api/reports', { method: 'POST', body }),
  retryAnalysis: (id) => call(`/api/reports/${id}/retry-analysis`, { method: 'POST' }),

  // Government Officials / Disaster Management Dashboard APIs
  officialStats: () => call('/api/official/dashboard/stats'),
  officialReports: () => call('/api/official/reports'),
  officialReportDetail: (id) => call(`/api/official/reports/${id}`),
  officialIncidents: () => call('/api/official/incidents'),
  officialAnalytics: () => call('/api/official/analytics'),
  officialMapMarkers: () => call('/api/official/map-markers'),
  officialReview: (body) => call('/api/official/review', { method: 'POST', body }),
};
