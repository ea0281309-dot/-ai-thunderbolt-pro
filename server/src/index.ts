import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Default: allow localhost dev origins + production Vercel frontend.
// Override/extend via ALLOWED_ORIGINS env var as needed.
const defaultOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://ai-thunderbolt-zs14xz6al-powershell.vercel.app',
];

function parseCorsOrigin(value: string | undefined): string | string[] {
  if (!value) {
    return defaultOrigins;
  }

  // A single "*" means allow all origins (global access).
  if (value.trim() === '*') {
    return '*';
  }

  // Otherwise split on commas, trim whitespace, ignore empty entries, and de-dupe.
  const origins = Array.from(
    new Set(
      value
        .split(',')
        .map((o) => o.trim())
        .filter((o) => o.length > 0),
    ),
  );

  // Fall back to the safe default list if the env var yields nothing usable.
  return origins.length > 0 ? origins : defaultOrigins;
}

const corsOrigin = parseCorsOrigin(process.env.ALLOWED_ORIGINS);

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'AI Thunderbolt Pro API' });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'AI Thunderbolt Pro API is running' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

export default app;
