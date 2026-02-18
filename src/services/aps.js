/**
 * APS API client using the backend (Node APS SDK).
 * All authentication and APS API calls go through the backend.
 */

// Use relative /api in dev (Vite proxies to backend); set VITE_APS_API_URL for production
const API_BASE = import.meta.env.VITE_APS_API_URL || '';

const credentials = () => ({ credentials: 'include' });

async function checkResponse(res, fallbackMessage) {
  if (res.ok) return;
  const is404 = res.status === 404;
  let body = {};
  try {
    body = await res.json();
  } catch {
    // e.g. Vite HTML 404 when backend is not running
  }
  const msg = body?.error ?? body?.message ?? fallbackMessage;
  const text = typeof msg === 'string' ? msg : fallbackMessage;
  if (is404 && !body?.error) {
    throw new Error(
      text + ' — Backend may not be running. Start it with: npm run server (or run both: npm run dev:all)'
    );
  }
  throw new Error(text);
}

export const apsService = {
  getAuthMode() {
    return localStorage.getItem('aps_auth_mode') || '3legged';
  },

  setAuthMode(mode) {
    localStorage.setItem('aps_auth_mode', mode);
  },

  getStoredCredentials() {
    return {
      clientId: localStorage.getItem('aps_custom_client_id') || import.meta.env.VITE_APS_CLIENT_ID,
      clientSecret: localStorage.getItem('aps_custom_client_secret') || '',
      redirectUri: localStorage.getItem('aps_custom_redirect_uri') || import.meta.env.VITE_APS_REDIRECT_URI,
    };
  },

  /**
   * Start 3-legged login: redirect to backend, which redirects to Autodesk.
   */
  login() {
    const { clientId } = this.getStoredCredentials();
    // Callback URL must be absolute; with Vite proxy it's same origin so backend receives the code
    const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const redirectUri = `${base}/api/auth/callback`;
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri });
    window.location.href = `${base}/api/auth/login?${params.toString()}`;
  },

  /**
   * 2-legged login: send credentials to backend (backend uses APS SDK).
   */
  async login2Legged(clientId, clientSecret) {
    const res = await fetch(`${API_BASE}/api/auth/2legged`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...credentials(),
      body: JSON.stringify({ clientId, clientSecret }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '2-legged login failed');
    }
    this.setAuthMode('2legged');
  },

  async isAuthenticated() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, credentials());
      const data = await res.json();
      return !!data.isAuthenticated;
    } catch {
      return false;
    }
  },

  logout() {
    return fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      ...credentials(),
    });
  },

  async getHubs() {
    const res = await fetch(`${API_BASE}/api/hubs`, credentials());
    await checkResponse(res, 'Failed to fetch hubs');
    return res.json();
  },

  async getProjects(hubId) {
    const res = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(hubId)}`, credentials());
    await checkResponse(res, 'Failed to fetch projects');
    return res.json();
  },

  async getIssues(projectId) {
    const res = await fetch(`${API_BASE}/api/issues/${encodeURIComponent(projectId)}`, credentials());
    await checkResponse(res, 'Failed to fetch issues');
    return res.json();
  },

  async getRFIs(projectId) {
    const res = await fetch(`${API_BASE}/api/rfis/${encodeURIComponent(projectId)}`, credentials());
    await checkResponse(res, 'Failed to fetch RFIs');
    return res.json();
  },

  async getSubmittals(projectId) {
    const res = await fetch(`${API_BASE}/api/submittals/${encodeURIComponent(projectId)}`, credentials());
    await checkResponse(res, 'Failed to fetch submittals');
    return res.json();
  },

  // Data Connector (ACC Insight; requires Account Executive)
  async getDataConnectorRequests() {
    const res = await fetch(`${API_BASE}/api/dc/requests`, credentials());
    await checkResponse(res, 'Failed to fetch Data Connector requests');
    return res.json();
  },

  async getDataConnectorJobs(requestId) {
    const res = await fetch(`${API_BASE}/api/dc/requests/${encodeURIComponent(requestId)}/jobs`, credentials());
    await checkResponse(res, 'Failed to fetch jobs');
    return res.json();
  },

  async getDataConnectorJobsList() {
    const res = await fetch(`${API_BASE}/api/dc/jobs`, credentials());
    await checkResponse(res, 'Failed to fetch jobs');
    return res.json();
  },

  async getDataConnectorDataListing(jobId) {
    const res = await fetch(`${API_BASE}/api/dc/jobs/${encodeURIComponent(jobId)}/data-listing`, credentials());
    await checkResponse(res, 'Failed to fetch data listing');
    return res.json();
  },

  async getDataConnectorFile(jobId, name) {
    const res = await fetch(`${API_BASE}/api/dc/jobs/${encodeURIComponent(jobId)}/data/${encodeURIComponent(name)}`, credentials());
    await checkResponse(res, 'Failed to fetch file');
    return res.json();
  },
};
