# AI Thunderbolt Pro — Backend Server

Express + TypeScript backend for the AI Thunderbolt Pro service.

## Local development

```bash
cd server
npm install
npm run dev        # ts-node (live reload not included; restart manually)
```

The server starts on **port 3001** by default (`PORT` env var overrides this).

## Build

```bash
npm run build      # compiles TypeScript → dist/
```

Output is written to `server/dist/` (`outDir` in tsconfig.json).

## Start (production)

```bash
npm start          # node dist/index.js
```

## Railway deployment

The service **illustrious-creativity** is deployed to [Railway](https://railway.app)
using the configuration in `server/railway.json`.

**Railway service settings:**

| Setting          | Value                             |
|------------------|-----------------------------------|
| Service name     | `illustrious-creativity`          |
| Root Directory   | `/server`                         |
| Builder          | NIXPACKS                          |
| Build command    | `npm install && npm run build`    |
| Start command    | `npm start`                       |
| `DATABASE_URL`   | `${{Postgres-rjq8.DATABASE_URL}}` |

**Backend URL:** `https://illustrious-creativity.up.railway.app`

### Builder

**NIXPACKS** is used as the builder (set via the `build.builder` field in
`railway.json`). NIXPACKS auto-detects the Node.js project and provides a
proper Node.js environment including `npm`, handling dependency installation
and compilation.

### Build command

```
npm install && npm run build
```

Railway runs this command inside the `server/` directory (the root of the
Railway service).

### Start command

```
npm start
```

Equivalent to `node dist/index.js`, which serves the compiled Express app.

### Environment variables

| Variable           | Default                                          | Description                          |
|--------------------|--------------------------------------------------|--------------------------------------|
| `PORT`             | `3001`                                           | Port the server listens on           |
| `ALLOWED_ORIGINS`  | `http://localhost:3000,http://localhost:5173`    | Comma-separated CORS-allowed origins |
| `DATABASE_URL`     | —                                                | PostgreSQL connection string (set via `${{Postgres-rjq8.DATABASE_URL}}` in Railway) |

Set `ALLOWED_ORIGINS` to your Vercel frontend URL in the Railway service
variables panel before deploying to production.

`DATABASE_URL` is automatically populated in Railway by linking the
`Postgres-rjq8` database service. The reference `${{Postgres-rjq8.DATABASE_URL}}`
in `railway.json` tells Railway to inject the database connection string at
deploy time.

### Deploy via Railway CLI

```bash
npm install -g @railway/cli
railway login
cd server
railway link       # select the illustrious-creativity service
railway up
```

Railway will automatically pick up `railway.json` and use the NIXPACKS builder.
