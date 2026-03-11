# ⚡ AI Thunderbolt Pro

> AI-powered calling service with emotional intelligence

## Overview

AI Thunderbolt Pro is a full-stack application that provides AI-assisted calling capabilities with real-time emotional analysis. The platform monitors caller sentiment and emotion during calls, giving you actionable insights in real time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express + TypeScript |
| Deployment (Frontend) | Vercel |
| Deployment (Backend) | Railway |

## Project Structure

```
ai-thunderbolt-pro/
├── src/                     # React frontend source
│   ├── components/
│   │   ├── CallPanel.jsx    # Call control UI
│   │   ├── EmotionDashboard.jsx  # Real-time emotion display
│   │   └── CallHistory.jsx  # Past calls log
│   ├── App.jsx
│   └── main.jsx
├── server/                  # Node.js backend
│   └── src/
│       └── index.ts         # Express API server
├── vercel.json              # Vercel deployment config
├── railway.json             # Railway deployment config
└── package.json             # Frontend dependencies
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd server && npm install
```

### 3. Configure environment variables

```bash
# Frontend
cp .env.example .env

# Backend
cp server/.env.example server/.env
```

### 4. Run in development

```bash
# Terminal 1 – frontend (http://localhost:5173)
npm run dev

# Terminal 2 – backend (http://localhost:3001)
cd server && npm run dev
```

## Deployment

### Frontend → Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Backend → Railway

```bash
npm i -g @railway/cli
railway login
cd server
railway init
railway up
```

After deploying, update the following:

1. Set `VITE_BACKEND_URL` in your Vercel project settings to your Railway URL.
2. Set `FRONTEND_URL` in your Railway environment variables to your Vercel URL.
3. Update the `vercel.json` rewrite destination to your Railway URL.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/calls/start` | Start a new call |
| `POST` | `/api/calls/:sid/end` | End an active call |
| `GET` | `/api/calls/:sid` | Get call details |
| `POST` | `/api/calls/:sid/emotion` | Analyze emotion |
| `GET` | `/api/calls` | List all calls |

## License

MIT © 2026 ea0281309-dot
