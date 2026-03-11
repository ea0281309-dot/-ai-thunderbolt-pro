# AI Thunderbolt Pro

AI Thunderbolt Pro now includes a minimal deployment-ready frontend and backend so the app can be published to Vercel and Railway.

## Project structure

- `src/`: static frontend assets copied into `dist/` during `npm run build`
- `server/src/index.js`: Node.js backend with a `/health` endpoint
- `vercel.json`: Vercel configuration for the frontend
- `server/railway.json`: Railway configuration for the backend

## Local development

Build and test the frontend:

```bash
npm run build
npm test
```

Build and test the backend:

```bash
cd server
npm run build
npm test
```

Run the backend locally:

```bash
cd server
npm run build
npm start
```

The backend listens on `PORT` or `3001` by default and exposes:

- `GET /health`

## Deploy frontend to Vercel

1. Install dependencies (no external packages are required, but Vercel still runs `npm install`).
2. Set the frontend environment variable:

   - `VITE_API_URL=https://YOUR-RAILWAY-APP.up.railway.app`

3. Deploy from the repository root:

```bash
npm run build
vercel --prod
```

Vercel uses:

- Build command: `npm run build`
- Output directory: `dist`

## Deploy backend to Railway

Deploy from the `server/` directory:

```bash
cd server
npm run build
railway up
```

Railway uses:

- Build command: `npm run build`
- Start command: `npm run start`
- Port: `PORT` provided by Railway

## Live URLs

After deployment, record the generated URLs here:

- Frontend: `https://YOUR-PROJECT.vercel.app`
- Backend: `https://YOUR-SERVICE.up.railway.app`

Update `VITE_API_URL` in Vercel whenever the Railway backend URL changes.
