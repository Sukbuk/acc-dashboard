/**
 * APS API client using the backend (Node APS SDK).
 * All authentication and APS API calls go through the backend.
 */

// Use relative /api in dev (Vite proxies to backend); set VITE_APS_API_URL for production
const API_BASE = import.meta.env.VITE_APS_API_URL || '';

const credentials = () => ({ credentials: 'include' });

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
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to fetch hubs');
    return res.json();
  },

  async getProjects(hubId) {
    const res = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(hubId)}`, credentials());
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to fetch projects');
    return res.json();
  },

  async getIssues(projectId) {
    const res = await fetch(`${API_BASE}/api/issues/${encodeURIComponent(projectId)}`, credentials());
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to fetch issues');
    return res.json();
  },

  async getRFIs(projectId) {
    const res = await fetch(`${API_BASE}/api/rfis/${encodeURIComponent(projectId)}`, credentials());
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to fetch RFIs');
    return res.json();
  },

  async getSubmittals(projectId) {
    const res = await fetch(`${API_BASE}/api/submittals/${encodeURIComponent(projectId)}`, credentials());
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to fetch submittals');
    return res.json();
  },
};
