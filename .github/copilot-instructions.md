# Copilot Instructions – AI Thunderbolt Pro

## Project Overview

AI Thunderbolt Pro is an AI-powered calling service with emotional-intelligence tracking.
The backend is an Express + TypeScript REST API deployed to **Railway**. A frontend
(Vite / React) is intended to be deployed to **Vercel**.

---

## Repository Layout

```
/                          ← repo root
├── .github/
│   ├── copilot-instructions.md   ← this file
│   └── workflows/
│       └── deploy.yml            ← CI: build check on push to main
├── server/                       ← Express + TypeScript backend
│   ├── src/
│   │   └── index.ts              ← single entry point, all routes here
│   ├── dist/                     ← compiled output (git-ignored)
│   ├── package.json
│   ├── tsconfig.json
│   ├── railway.json              ← Railway service config (Root Dir = /server)
│   └── .env.example              ← copy to .env for local dev
├── railway.json                  ← alternative root-level Railway config
├── vercel.json                   ← Vercel frontend routing config
└── README.md                     ← quickstart & API reference
```

---

## Backend – server/

### Stack
- **Runtime:** Node.js ≥ 18
- **Framework:** Express 4
- **Language:** TypeScript 5 (compiled to CommonJS, output in `dist/`)
- **Key deps:** `cors`, `express`

### Local Development

```bash
cd server
cp .env.example .env          # fill in values (PORT is optional)
npm install
npm run dev                   # ts-node src/index.ts  (hot-reload)
```

### Build & Start (production)

```bash
cd server
npm ci
npm run build                 # tsc → dist/
npm start                     # node dist/index.js
```

### Environment Variables

| Variable          | Required | Default                                    | Description                                          |
|-------------------|----------|--------------------------------------------|------------------------------------------------------|
| `PORT`            | No       | `3001`                                     | HTTP port the server listens on                      |
| `DATABASE_URL`    | No       | –                                          | PostgreSQL connection string (injected by Railway)   |
| `ALLOWED_ORIGINS` | No       | `http://localhost:3000,http://localhost:5173` | Comma-separated CORS origins, or `*` for all         |

> In production **Railway** injects `DATABASE_URL` automatically from the
> linked `Postgres-rjq8` add-on. `ALLOWED_ORIGINS` should be set to the live
> Vercel frontend URL.

---

## API Reference (v2)

Base URL (production): `https://illustrious-creativity.up.railway.app`

| Method | Path                          | Description                           |
|--------|-------------------------------|---------------------------------------|
| GET    | `/`                           | Liveness probe (v1 legacy)            |
| GET    | `/health`                     | Service + DB status (v1 legacy)       |
| GET    | `/api/v2/health`              | Service + DB status (v2)              |
| POST   | `/api/v2/calls/start`         | Start a new call session              |
| POST   | `/api/v2/calls/:sid/end`      | End an active call                    |
| GET    | `/api/v2/calls/:sid`          | Retrieve a single call record         |
| POST   | `/api/v2/calls/:sid/emotion`  | Append an emotion data point          |
| GET    | `/api/v2/calls`               | List all call records                 |

### Emotion payload (POST `/api/v2/calls/:sid/emotion`)

```json
{
  "emotion": "joy",
  "confidence": 0.92,
  "sentiment": "positive"
}
```

- `emotion` – non-empty string label (e.g. `"joy"`, `"anger"`)
- `confidence` – float 0–1
- `sentiment` – `"positive"` | `"negative"` | `"neutral"`

> **Note:** Call records are currently stored in-memory (`Map`). To persist
> across restarts, replace the in-memory `calls` Map in `server/src/index.ts`
> with database queries using `DATABASE_URL`.

---

## Coding Conventions

- All new routes go in `server/src/index.ts` under the `// v2 routes` section,
  or in a new router file imported there.
- Use TypeScript `interface` types for all request/response shapes.
- Return `res.status(4xx).json({ error: '<message>' })` for client errors; never
  throw unhandled exceptions from route handlers.
- CORS origins must always be configured via `ALLOWED_ORIGINS`; never hard-code
  production URLs in source code.
- Keep `server/dist/` and `node_modules/` out of git (already in `.gitignore`).

---

## Deployment

### Backend → Railway

Railway is configured with `server/railway.json` (Root Directory = `/server`):

```json
{
  "build": { "builder": "RAILPACK", "buildCommand": "npm ci && npm run build" },
  "deploy": {
    "startCommand": "npm start",
    "envVars": { "DATABASE_URL": "${{Postgres-rjq8.DATABASE_URL}}" }
  }
}
```

Push to `main` triggers the GitHub Actions build check. Railway watches the
`main` branch separately and deploys automatically after a successful build.

**Railway CLI quick-deploy:**

```bash
npm i -g @railway/cli
railway login
cd server
railway link          # select the illustrious-creativity service
railway up
```

### Frontend → Vercel

`vercel.json` at the repo root routes all requests to `server/src/index.ts`
(useful for serverless preview deployments). For a dedicated React/Vite frontend,
deploy from the project root and set:

| Setting           | Value           |
|-------------------|-----------------|
| Framework         | Vite            |
| Build command     | `npm run build` |
| Output directory  | `dist`          |
| Install command   | `npm install`   |

Set `VITE_API_URL` in the Vercel environment to the Railway backend URL.

---

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`:

1. Checks out code
2. Sets up Node 18
3. Runs `npm ci` inside `server/`
4. Runs `npm run build` (TypeScript compile) – fails the workflow if there are
   type errors or compilation failures

There is no automated deploy step in the workflow; Railway handles that via its
own GitHub integration.

---

## Common Copilot Tasks

- **Add a new API endpoint:** follow the pattern in `server/src/index.ts`
  (`app.get/post/put/delete`), define request/response interfaces, and add a row
  to the API Reference table above.
- **Persist call data to PostgreSQL:** use `pg` or `@prisma/client`; read
  `DATABASE_URL` from `process.env`.
- **Add authentication:** add a JWT middleware before protected routes; store
  secrets in Railway environment variables, never in source.
- **Connect a frontend:** set `VITE_API_URL` in the frontend env to the Railway
  backend URL and use `ALLOWED_ORIGINS` on the backend.
