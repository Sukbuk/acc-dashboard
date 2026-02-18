import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import crypto from 'crypto';
import { SdkManagerBuilder } from '@aps_sdk/autodesk-sdkmanager';
import { AuthenticationClient, ResponseType, Scopes } from '@aps_sdk/authentication';
import { DataManagementClient } from '@aps_sdk/data-management';
import { StaticAuthenticationProvider } from '@aps_sdk/autodesk-sdkmanager';
import { IssuesClient } from '@aps_sdk/construction-issues';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const APS_BASE = 'https://developer.api.autodesk.com';

// APS credentials (from env or session for 2-legged override)
const APS_CLIENT_ID = process.env.APS_CLIENT_ID || process.env.VITE_APS_CLIENT_ID;
const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET || process.env.VITE_APS_CLIENT_SECRET;
const APS_REDIRECT_URI = process.env.APS_REDIRECT_URI || process.env.VITE_APS_REDIRECT_URI || `http://localhost:${PORT}/api/auth/callback`;

const APS_SCOPES = [Scopes.DataRead, Scopes.AccountRead];

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'acc-dashboard-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

const sdkManager = SdkManagerBuilder.create().build();
const authClient = new AuthenticationClient({ sdkManager });

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getAccessToken(req) {
  const creds = req.session?.aps_credentials;
  if (!creds?.access_token) return null;
  if (creds.expires_at && Date.now() >= creds.expires_at) return null;
  return creds.access_token;
}

async function ensureToken(req, res, next) {
  const creds = req.session?.aps_credentials;
  if (!creds) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (creds.auth_mode === '3legged' && creds.refresh_token && creds.expires_at && Date.now() >= creds.expires_at - 60000) {
    try {
      const refreshed = await authClient.refreshToken(creds.refresh_token, creds.client_id, {
        clientSecret: creds.client_secret || undefined,
      });
      req.session.aps_credentials = {
        ...creds,
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || creds.refresh_token,
        expires_at: refreshed.expires_at || Date.now() + refreshed.expires_in * 1000,
      };
    } catch (err) {
      console.error('Token refresh failed:', err?.response?.data || err.message);
      delete req.session.aps_credentials;
      return res.status(401).json({ error: 'Session expired' });
    }
  }
  if (!getAccessToken(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// ---------- Auth routes ----------

app.get('/api/auth/me', (req, res) => {
  const token = getAccessToken(req);
  const authMode = req.session?.aps_credentials?.auth_mode || null;
  res.json({ isAuthenticated: !!token, authMode });
});

app.get('/api/auth/login', (req, res) => {
  const clientId = req.query.client_id || APS_CLIENT_ID;
  const redirectUri = req.query.redirect_uri || APS_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return res.status(400).json({ error: 'Missing client_id or redirect_uri' });
  }
  const verifier = generateCodeVerifier();
  req.session.aps_code_verifier = verifier;
  req.session.aps_pending = { client_id: clientId, redirect_uri: redirectUri };
  const challenge = generateCodeChallenge(verifier);
  const url = authClient.authorize(clientId, ResponseType.Code, redirectUri, APS_SCOPES, {
    codeChallenge: challenge,
    codeChallengeMethod: 'S256',
  });
  res.redirect(url);
});

app.get('/api/auth/callback', async (req, res) => {
  const { code } = req.query;
  const verifier = req.session?.aps_code_verifier;
  const pending = req.session?.aps_pending;
  if (!code || !verifier || !pending) {
    return res.redirect(`${FRONTEND_URL}?error=auth_callback_missing`);
  }
  const clientSecret = req.query.client_secret || APS_CLIENT_SECRET;
  try {
    const token = await authClient.getThreeLeggedToken(
      pending.client_id,
      code,
      pending.redirect_uri,
      { code_verifier: verifier, clientSecret: clientSecret || undefined }
    );
    req.session.aps_credentials = {
      access_token: token.access_token,
      refresh_token: token.refresh_token || '',
      expires_at: token.expires_at || Date.now() + token.expires_in * 1000,
      auth_mode: '3legged',
      client_id: pending.client_id,
      client_secret: clientSecret || '',
    };
    delete req.session.aps_code_verifier;
    delete req.session.aps_pending;
    res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error('Token exchange error:', err?.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}?error=token_exchange_failed`);
  }
});

app.post('/api/auth/2legged', async (req, res) => {
  const clientId = req.body?.clientId || APS_CLIENT_ID;
  const clientSecret = req.body?.clientSecret || APS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Missing clientId or clientSecret' });
  }
  try {
    const token = await authClient.getTwoLeggedToken(clientId, clientSecret, APS_SCOPES);
    const expiresAt = token.expires_at || Date.now() + (token.expires_in || 3600) * 1000;
    req.session.aps_credentials = {
      access_token: token.access_token,
      refresh_token: '',
      expires_at: expiresAt,
      auth_mode: '2legged',
      client_id: clientId,
      client_secret: clientSecret,
    };
    res.json({ ok: true });
  } catch (err) {
    console.error('2-legged auth error:', err?.response?.data || err.message);
    res.status(401).json({ error: err?.response?.data?.error_description || '2-legged login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  delete req.session.aps_credentials;
  res.json({ ok: true });
});

// ---------- APS API routes (use SDK) ----------

app.get('/api/hubs', ensureToken, async (req, res) => {
  try {
    const token = getAccessToken(req);
    const dmClient = new DataManagementClient({
      sdkManager,
      authenticationProvider: new StaticAuthenticationProvider(token),
    });
    const hubs = await dmClient.getHubs({ accessToken: token });
    const data = hubs?.data ?? [];
    res.json(data);
  } catch (err) {
    console.error('getHubs error:', err?.response?.data || err.message);
    res.status(err?.response?.status || 500).json({ error: err?.response?.data || err.message });
  }
});

app.get('/api/projects/:hubId', ensureToken, async (req, res) => {
  try {
    const token = getAccessToken(req);
    const dmClient = new DataManagementClient({
      sdkManager,
      authenticationProvider: new StaticAuthenticationProvider(token),
    });
    const projects = await dmClient.getHubProjects(req.params.hubId, { accessToken: token });
    const data = projects?.data ?? [];
    res.json(data);
  } catch (err) {
    console.error('getProjects error:', err?.response?.data || err.message);
    res.status(err?.response?.status || 500).json({ error: err?.response?.data || err.message });
  }
});

app.get('/api/issues/:projectId', ensureToken, async (req, res) => {
  try {
    const token = getAccessToken(req);
    const projectId = req.params.projectId.replace(/^b\./, '');
    const issuesClient = new IssuesClient({
      sdkManager,
      authenticationProvider: new StaticAuthenticationProvider(token),
    });
    const page = await issuesClient.getIssues(projectId, { accessToken: token, limit: 100 });
    const results = (page?.results ?? []).map((r) => ({
      ...r,
      identifier: r.identifier ?? (r.displayId != null ? String(r.displayId) : undefined),
    }));
    res.json(results);
  } catch (err) {
    console.error('getIssues error:', err?.response?.data || err.message);
    res.status(err?.response?.status || 500).json({ error: err?.response?.data || err.message });
  }
});

// RFI and Submittals: no dedicated SDK package, use REST with SDK-provided token
app.get('/api/rfis/:projectId', ensureToken, async (req, res) => {
  try {
    const token = getAccessToken(req);
    const projectId = req.params.projectId.replace(/^b\./, '');
    const { data } = await axios.get(
      `${APS_BASE}/construction/rfi/v2/projects/${projectId}/rfis`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.json(data.results ?? []);
  } catch (err) {
    console.error('getRFIs error:', err?.response?.data || err.message);
    res.status(err?.response?.status || 500).json({ error: err?.response?.data || err.message });
  }
});

app.get('/api/submittals/:projectId', ensureToken, async (req, res) => {
  try {
    const token = getAccessToken(req);
    const projectId = req.params.projectId.replace(/^b\./, '');
    const { data } = await axios.get(
      `${APS_BASE}/construction/submittals/v1/projects/${projectId}/items`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.json(data.results ?? []);
  } catch (err) {
    console.error('getSubmittals error:', err?.response?.data || err.message);
    res.status(err?.response?.status || 500).json({ error: err?.response?.data || err.message });
  }
});

app.listen(PORT, () => {
  console.log(`ACC Dashboard API running at http://localhost:${PORT}`);
});
