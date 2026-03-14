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

The service is deployed to [Railway](https://railway.app) using the
configuration in `server/railway.json`.

### Builder

**RAILPACK** is used as the builder (set via the `build.builder` field in
`railway.json`). RAILPACK auto-detects the Node.js project and handles
dependency installation and compilation.

### Build command

```
npm ci && npm run build
```

Railway runs this command inside the `server/` directory (the root of the
Railway service).

### Start command

```
npm start
```

Equivalent to `node dist/index.js`, which serves the compiled Express app.

### Environment variables

| Variable           | Default                                                                                             | Description                          |
|--------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------|
| `PORT`             | `3001`                                                                                              | Port the server listens on           |
| `ALLOWED_ORIGINS`  | `http://localhost:3000`, `http://localhost:5173`, `https://ai-thunderbolt-zs14xz6al-powershell.vercel.app` | Comma-separated CORS-allowed origins. Set to `*` for global access. |

Set `ALLOWED_ORIGINS=*` in the Railway service variables panel to allow all
origins, or provide a comma-separated list of specific allowed origins.

### Deploy via Railway CLI

```bash
npm install -g @railway/cli
railway login
cd server
railway link       # link to an existing project, or use `railway init`
railway up
```

Railway will automatically pick up `railway.json` and use the RAILPACK builder.
