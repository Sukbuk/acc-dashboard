import axios from 'axios';

const APS_CLIENT_ID = import.meta.env.VITE_APS_CLIENT_ID;
const APS_REDIRECT_URI = import.meta.env.VITE_APS_REDIRECT_URI;
const APS_BASE_URL = 'https://developer.api.autodesk.com';

/**
 * Generate a random string for the PKCE code verifier.
 */
function generateCodeVerifier() {
  const array = new Uint32Array(56);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

/**
 * Generate a SHA-256 hash of the code verifier and base64url encode it.
 */
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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
      redirectUri: localStorage.getItem('aps_custom_redirect_uri') || import.meta.env.VITE_APS_REDIRECT_URI
    };
  },

  /**
   * Start the 3-legged login flow by redirecting to Autodesk.
   */
  async login() {
    const { clientId, redirectUri } = this.getStoredCredentials();
    const verifier = generateCodeVerifier();
    localStorage.setItem('aps_code_verifier', verifier);
    const challenge = await generateCodeChallenge(verifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'data:read account:read',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `${APS_BASE_URL}/authentication/v2/authorize?${params.toString()}`;
  },

  /**
   * 2-Legged Authentication (Client Credentials Flow)
   */
  async login2Legged(clientId, clientSecret) {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'data:read account:read',
    });

    const response = await axios.post(`${APS_BASE_URL}/authentication/v2/token`, params);
    const { access_token, expires_in } = response.data;
    
    localStorage.setItem('aps_access_token', access_token);
    localStorage.setItem('aps_token_expiry', Date.now() + expires_in * 1000);
    this.setAuthMode('2legged');

    return access_token;
  },

  /**
   * Handle the callback and exchange the code for a token.
   */
  async handleCallback(code) {
    const { clientId, clientSecret, redirectUri } = this.getStoredCredentials();
    const verifier = localStorage.getItem('aps_code_verifier');
    if (!verifier) throw new Error('Code verifier not found');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });

    // If clientSecret is provided (Web App type), include it in the request
    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    try {
      const response = await axios.post(`${APS_BASE_URL}/authentication/v2/token`, params);
      const { access_token, refresh_token, expires_in } = response.data;
      
      localStorage.setItem('aps_access_token', access_token);
      localStorage.setItem('aps_refresh_token', refresh_token || '');
      localStorage.setItem('aps_token_expiry', Date.now() + expires_in * 1000);
      localStorage.removeItem('aps_code_verifier'); // Clear verifier
      this.setAuthMode('3legged');

      return access_token;
    } catch (err) {
      console.error('Exchange error details:', err.response?.data || err.message);
      throw err;
    }
  },

  getToken() {
    return localStorage.getItem('aps_access_token');
  },

  isAuthenticated() {
    const token = this.getToken();
    const expiry = localStorage.getItem('aps_token_expiry');
    return !!token && Date.now() < parseInt(expiry || '0');
  },

  logout() {
    localStorage.removeItem('aps_access_token');
    localStorage.removeItem('aps_refresh_token');
    localStorage.removeItem('aps_token_expiry');
    localStorage.removeItem('aps_code_verifier');
  },

  /**
   * Generic authenticated GET request.
   */
  async _get(endpoint) {
    const token = this.getToken();
    return axios.get(`${APS_BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  /**
   * Data Fetching
   */

  async getHubs() {
    const res = await this._get('/project/v1/hubs');
    return res.data.data;
  },

  async getProjects(hubId) {
    const res = await this._get(`/project/v1/hubs/${hubId}/projects`);
    return res.data.data;
  },

  // ACC Issues API
  async getIssues(projectId) {
    // Project ID in ACC often needs the 'b.' prefix removed or added depending on endpoint
    // Usually Data Management uses hubId + projectId
    // ACC Issues API uses projectId directly (without b. prefix usually)
    const cleanProjectId = projectId.replace('b.', '');
    const res = await this._get(`/construction/issues/v1/projects/${cleanProjectId}/issues`);
    return res.data.results;
  },

  // ACC RFI API
  async getRFIs(projectId) {
    const cleanProjectId = projectId.replace('b.', '');
    const res = await this._get(`/construction/rfi/v2/projects/${cleanProjectId}/rfis`);
    return res.data.results;
  },

  // ACC Submittals API
  async getSubmittals(projectId) {
    const cleanProjectId = projectId.replace('b.', '');
    const res = await this._get(`/construction/submittals/v1/projects/${cleanProjectId}/items`);
    return res.data.results;
  }
};
