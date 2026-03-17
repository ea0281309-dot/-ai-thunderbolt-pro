# ⚡ GitHub Copilot Quickstart - Copy & Paste

Use this quickstart if you're launching AI Thunderbolt Pro from scratch or reusing the setup steps for a fresh project.

## 🚀 Launch in 5 Steps

---

## STEP 1: Create GitHub Repo

**Copy this into Copilot Chat:**

```text
Create a GitHub repository for my AI Thunderbolt Pro project with:
- Name: ai-thunderbolt-pro
- Description: AI-powered calling service with emotional intelligence
- Public repo
- Add README, .gitignore (Node), MIT license
```

---

## STEP 2: Push Code to GitHub

**Copy these commands (run in terminal):**

Replace the ALL_CAPS placeholders with your actual GitHub username before running these commands.

```bash
cd ai-thunderbolt-pro

git init
git add .
git commit -m "Initial commit: AI Thunderbolt Pro v1.0"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ai-thunderbolt-pro.git
git push -u origin main
```

---

## STEP 3: Deploy Frontend (Vercel)

The `client/` directory contains the React/Vite frontend. `vercel.json` is
already configured to build from `client/` and serve the static output.

**Deploy via Vercel CLI:**

```bash
npm i -g vercel
vercel login
vercel --prod
```

**Or connect the GitHub repo in the Vercel dashboard** — it will detect
`vercel.json` automatically.

**After deploying, set the following environment variable in the Vercel dashboard:**

| Variable        | Value                                              |
|-----------------|----------------------------------------------------|
| `VITE_API_URL`  | `https://illustrious-creativity.up.railway.app`    |

**Then redeploy** so the frontend picks up the production backend URL.

---

## STEP 4: Deploy Backend (Railway)

The `server/railway.json` configuration is already committed and uses the
**NIXPACKS** builder. The service is named **illustrious-creativity** and is
linked to the **Postgres-rjq8** database. Railway will automatically run
`npm install && npm run build` inside the `server/` directory (Root Directory is
set to `/server`) and start the service with `npm start` (`node dist/index.js`).

**Railway service settings:**

| Setting          | Value                          |
|------------------|--------------------------------|
| Service name     | `illustrious-creativity`       |
| Root Directory   | `/server`                      |
| Builder          | NIXPACKS                       |
| Build command    | `npm install && npm run build` |
| Start command    | `npm start`                    |
| `DATABASE_URL`   | `${{Postgres-rjq8.DATABASE_URL}}` |

**Backend URL:** `https://illustrious-creativity.up.railway.app`

**To link and deploy via Railway CLI:**

```bash
npm i -g @railway/cli
railway login
cd server
railway link   # select the illustrious-creativity service
railway up
```

Set the `ALLOWED_ORIGINS` environment variable in the Railway dashboard:

- **Global access (all origins):** set `ALLOWED_ORIGINS` to `*`
- **Restricted access:** set `ALLOWED_ORIGINS` to a comma-separated list of
  allowed frontend URLs, e.g. `https://your-app.vercel.app`

Once deployed, your Railway service URL is:
`https://illustrious-creativity.up.railway.app`

---

## STEP 5: Connect Everything

Replace the ALL_CAPS placeholders `YOUR_VERCEL_URL` and `YOUR_RAILWAY_URL` with your deployed app URLs, for example `https://your-app.vercel.app` and `https://illustrious-creativity.up.railway.app`.

**Copy this into Copilot Chat:**

```text
My frontend is at: YOUR_VERCEL_URL
My backend is at: YOUR_RAILWAY_URL

Update my frontend API calls from localhost:3001 to the production backend.
Show me which files to update and what changes to make.
```

---

## ✅ DONE!

Your AI Thunderbolt Pro is now live on:
- **Frontend**: https://ai-thunderbolt-pro.vercel.app *(replace with your Vercel URL after deployment)*
- **Backend**: https://illustrious-creativity.up.railway.app ✅ (deployed, DATABASE_URL connected to Postgres-rjq8)

---

## 🎯 Common Copilot Prompts

### Add Feature

```text
Add FEATURE to my AI Thunderbolt Pro that does DESCRIPTION.
Generate complete code for frontend, backend, and integration.
```

### Fix Bug

```text
Fix this error: ERROR_MESSAGE
File: FILE_PATH
Code:
PASTE_CODE_HERE
```

### Optimize

```text
Optimize this code for better performance:
PASTE_CODE_HERE
```

### Deploy

```text
Deploy my FRONTEND_OR_BACKEND to PLATFORM with these settings: SETTINGS
```

---

**Just copy, paste, and launch! 🚀**

---

## 📡 API Reference (v2)

Base URL: `https://illustrious-creativity.up.railway.app` (or `http://localhost:3001` for local development)

All v2 endpoints are prefixed with `/api/v2`.

---

### Health

#### `GET /api/v2/health`

Returns the service health status and API version.

**Response `200`**
```json
{
  "status": "ok",
  "version": "v2",
  "service": "AI Thunderbolt Pro API"
}
```

---

### Calls

#### `POST /api/v2/calls/start`

Start a new call session. Returns a unique session ID (`sid`) used for all subsequent call operations.

**Request body** — none required

**Response `201`**
```json
{
  "sid": "CA1A2B3C4D5E6F",
  "status": "active",
  "startedAt": "2026-03-14T02:41:57.849Z",
  "emotions": []
}
```

---

#### `POST /api/v2/calls/:sid/end`

End an active call session. Records the end time and calculates the total duration in seconds.

**Path parameter**

| Parameter | Type   | Description              |
|-----------|--------|--------------------------|
| `sid`     | string | Call session ID to end   |

**Response `200`**
```json
{
  "sid": "CA1A2B3C4D5E6F",
  "status": "ended",
  "startedAt": "2026-03-14T02:41:57.849Z",
  "endedAt": "2026-03-14T02:51:57.849Z",
  "durationSeconds": 600,
  "emotions": []
}
```

**Error responses**

| Status | Reason                   |
|--------|--------------------------|
| `404`  | Call session not found   |
| `409`  | Call already ended       |

---

#### `GET /api/v2/calls/:sid`

Retrieve a single call session, including its emotion history.

**Path parameter**

| Parameter | Type   | Description            |
|-----------|--------|------------------------|
| `sid`     | string | Call session ID        |

**Response `200`**
```json
{
  "sid": "CA1A2B3C4D5E6F",
  "status": "active",
  "startedAt": "2026-03-14T02:41:57.849Z",
  "emotions": [
    {
      "emotion": "happy",
      "confidence": 0.92,
      "sentiment": "positive",
      "timestamp": "2026-03-14T02:42:10.000Z"
    }
  ]
}
```

**Error responses**

| Status | Reason                 |
|--------|------------------------|
| `404`  | Call session not found |

---

#### `POST /api/v2/calls/:sid/emotion`

Append an emotion data point to an active call. Intended to be called on a recurring interval by the frontend as the AI analyzes the conversation.

**Path parameter**

| Parameter | Type   | Description         |
|-----------|--------|---------------------|
| `sid`     | string | Active call session |

**Request body**

| Field        | Type                                   | Required | Description                         |
|--------------|----------------------------------------|----------|-------------------------------------|
| `emotion`    | string                                 | ✅       | Detected emotion label (e.g. `"happy"`, `"anxious"`) |
| `confidence` | number (0–1)                           | ✅       | Model confidence score              |
| `sentiment`  | `"positive"` \| `"negative"` \| `"neutral"` | ✅  | Sentiment category                  |

```json
{
  "emotion": "calm",
  "confidence": 0.87,
  "sentiment": "neutral"
}
```

**Response `201`**
```json
{
  "emotion": "calm",
  "confidence": 0.87,
  "sentiment": "neutral",
  "timestamp": "2026-03-14T02:43:00.000Z"
}
```

**Error responses**

| Status | Reason                                        |
|--------|-----------------------------------------------|
| `400`  | Missing required fields                       |
| `404`  | Call session not found                        |
| `409`  | Cannot add emotion data to an ended call      |

---

#### `GET /api/v2/calls`

List all call sessions (active and ended).

**Response `200`**
```json
[
  {
    "sid": "CA1A2B3C4D5E6F",
    "status": "ended",
    "startedAt": "2026-03-14T02:41:57.849Z",
    "endedAt": "2026-03-14T02:51:57.849Z",
    "durationSeconds": 600,
    "emotions": []
  }
]
```
