# ACC Dashboard

Autodesk Construction Cloud dashboard using the official **APS Node.js SDK** (`@aps_sdk/*`) for authentication, Data Management (hubs/projects), and Construction Issues. RFI and Submittals use the same token via REST.

## Setup

1. **Environment**
   - Copy `.env.example` to `.env` and set your APS app credentials.
   - In the [APS Application](https://aps.autodesk.com/myapps) set the **Callback URL** to:
     - `http://localhost:5173/api/auth/callback` (when using Vite dev proxy)

2. **Install and run**
   - `npm install`
   - **Option A (one terminal):** `npm run dev:all` — runs backend (port 3000) and frontend (port 5173) together.
   - **Option B (two terminals):** `npm run server` in one, `npm run dev` in the other. The frontend proxies `/api` to the backend.

3. **Auth**
   - **3-legged:** Click “Login with Autodesk” → redirects to backend → Autodesk → back to app. Session is stored on the server; token refresh is handled by the backend.
   - **2-legged:** In Settings, choose 2-Legged and enter Client ID + Client Secret; save to log in (backend uses APS SDK to get a token).

## API

All APS calls go through the backend, which uses:

- `@aps_sdk/authentication` — 2-legged and 3-legged tokens, PKCE, refresh
- `@aps_sdk/data-management` — hubs, projects
- `@aps_sdk/construction-issues` — issues
- REST (with same token) — RFI and Submittals (no dedicated SDK package)
