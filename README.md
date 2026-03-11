# ⚡ AI Thunderbolt Pro

AI-powered calling service with emotional intelligence.

## Project Structure

```
.
├── backend/    Express.js API — deployable to Railway
└── frontend/   Next.js 16 app — deployable to Vercel
```

---

## 🚀 Deployment

### Backend → Railway

1. Create a new Railway project and connect the repo.
2. Set **Root Directory** to `backend`.
3. Railway auto-detects Node.js via `railway.toml`.
4. Add environment variables:
   ```
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   OPENAI_API_KEY=your_key   # optional – for production AI features
   ```
5. Railway will call `npm start` and health-check `/health`.

### Frontend → Vercel

1. Import the repo into Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.up.railway.app
   ```
4. Deploy — Vercel auto-detects Next.js.

---

## 🛠 Local Development

### Backend

```bash
cd backend
cp .env.example .env   # edit as needed
npm install
npm run dev            # http://localhost:3001
```

Test the health endpoint:
```bash
curl http://localhost:3001/health
```

Run tests:
```bash
npm test
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_BACKEND_URL
npm install
npm run dev                   # http://localhost:3000
```

---

## 📡 API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/api/deployment` | Live deployment URLs |
| `GET` | `/api/calls` | List all calls |
| `POST` | `/api/calls` | Initiate a new AI call |
| `GET` | `/api/calls/:id` | Get call details |
| `PUT` | `/api/calls/:id/status` | Update call status |
| `DELETE` | `/api/calls/:id` | Delete a call |
| `POST` | `/api/analysis/emotion` | Analyze emotion from text |
| `POST` | `/api/analysis/sentiment` | Sentiment analysis |
| `POST` | `/api/analysis/call-quality` | Call quality metrics |

### Deployment URL Response

```json
{
  "frontend": { "platform": "Vercel", "url": "https://your-app.vercel.app" },
  "backend":  { "platform": "Railway", "url": "https://your-app.up.railway.app" },
  "instructions": { ... }
}
```

To see your live URLs, open the **🔗 Deployment URLs** tab in the dashboard, or run:

```bash
curl https://your-backend.up.railway.app/api/deployment
```

### Health Check Response

```json
{
  "status": "ok",
  "service": "AI Thunderbolt Pro",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 42,
  "timestamp": "2026-03-11T00:00:00.000Z"
}
```
