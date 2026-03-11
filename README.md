# ⚡ AI Thunderbolt Pro

AI-powered calling service with emotional intelligence.

## Architecture

| Layer    | Technology  | Platform |
|----------|-------------|----------|
| Frontend | Next.js 16 + Tailwind CSS | **Vercel** |
| Backend  | Node.js + Express | **Railway** |

---

## 🚀 Deployment

### Prerequisites

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `RAILWAY_TOKEN` | [railway.app](https://railway.app) → Account Settings → Tokens |

Add both as **GitHub repository secrets** (Settings → Secrets and variables → Actions).

---

### Deploy Frontend → Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From the `frontend/` directory:
   ```bash
   vercel login
   vercel link          # link to your Vercel project
   vercel env add NEXT_PUBLIC_API_URL   # paste your Railway backend URL
   vercel --prod
   ```
3. Your frontend URL will look like:
   ```
   https://ai-thunderbolt-pro.vercel.app
   ```

### Deploy Backend → Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. From the `backend/` directory:
   ```bash
   railway login
   railway init         # create a new project
   railway variables set PORT=8080
   railway variables set ALLOWED_ORIGIN=https://ai-thunderbolt-pro.vercel.app
   railway up
   ```
3. Your backend URL will look like:
   ```
   https://ai-thunderbolt-pro-backend.up.railway.app
   ```

---

### Automated CI/CD (GitHub Actions)

Push to `main` and the [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) workflow will:

1. Lint + build the frontend, then deploy to **Vercel**
2. Test the backend, then deploy to **Railway**

---

## 🛠 Local Development

### Backend

```bash
cd backend
cp .env.example .env      # edit as needed
npm install
npm run dev               # runs on http://localhost:8080
```

API endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/calls` | List all calls |
| POST | `/api/calls` | Initiate a new call (`{to, message}`) |
| GET | `/api/calls/:id` | Get call status |
| GET | `/api/emotions` | List supported emotions |
| POST | `/api/emotions/analyze` | Analyze emotion in text (`{text}`) |

### Frontend

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev                  # runs on http://localhost:3000
```

---

## 📁 Project Structure

```
├── .github/workflows/deploy.yml   # CI/CD pipeline
├── frontend/                      # Next.js app (→ Vercel)
│   ├── app/
│   ├── components/
│   ├── lib/api.ts
│   └── vercel.json
└── backend/                       # Express API (→ Railway)
    ├── src/
    │   ├── app.js
    │   ├── index.js
    │   ├── routes/
    │   └── middleware/
    ├── railway.toml
    └── Procfile
```

