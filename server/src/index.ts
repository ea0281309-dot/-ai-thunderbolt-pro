import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;

const rawOrigins = process.env.ALLOWED_ORIGINS;
const corsOrigin: string | string[] =
  rawOrigins === '*'
    ? '*'
    : rawOrigins
      ? rawOrigins.split(',').map((o) => o.trim())
      : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmotionEntry {
  emotion: string;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: string;
}

interface CallRecord {
  sid: string;
  status: 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  emotions: EmotionEntry[];
}

// ---------------------------------------------------------------------------
// Persistence layer — PostgreSQL when DATABASE_URL is set, in-memory otherwise
// ---------------------------------------------------------------------------

let pool: Pool | null = null;
const memCalls = new Map<string, CallRecord>();

async function initDb(): Promise<void> {
  if (!DATABASE_URL) return;
  pool = new Pool({ connectionString: DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS calls (
      sid             TEXT PRIMARY KEY,
      status          TEXT NOT NULL,
      started_at      TIMESTAMPTZ NOT NULL,
      ended_at        TIMESTAMPTZ,
      duration_seconds INT,
      emotions        JSONB NOT NULL DEFAULT '[]'
    )
  `);
}

function rowToRecord(row: Record<string, unknown>): CallRecord {
  return {
    sid: row.sid as string,
    status: row.status as 'active' | 'ended',
    startedAt: (row.started_at as Date).toISOString(),
    endedAt: row.ended_at ? (row.ended_at as Date).toISOString() : undefined,
    durationSeconds: row.duration_seconds != null ? (row.duration_seconds as number) : undefined,
    emotions: (row.emotions as EmotionEntry[]) ?? [],
  };
}

async function dbGetCall(sid: string): Promise<CallRecord | null> {
  if (!pool) return memCalls.get(sid) ?? null;
  const { rows } = await pool.query('SELECT * FROM calls WHERE sid = $1', [sid]);
  return rows.length ? rowToRecord(rows[0]) : null;
}

async function dbListCalls(): Promise<CallRecord[]> {
  if (!pool) return Array.from(memCalls.values());
  const { rows } = await pool.query('SELECT * FROM calls ORDER BY started_at DESC');
  return rows.map(rowToRecord);
}

async function dbInsertCall(record: CallRecord): Promise<void> {
  if (!pool) { memCalls.set(record.sid, record); return; }
  await pool.query(
    `INSERT INTO calls (sid, status, started_at, emotions)
     VALUES ($1, $2, $3, $4)`,
    [record.sid, record.status, record.startedAt, JSON.stringify(record.emotions)],
  );
}

async function dbEndCall(sid: string, endedAt: string, durationSeconds: number): Promise<CallRecord | null> {
  if (!pool) {
    const r = memCalls.get(sid);
    if (!r) return null;
    r.status = 'ended';
    r.endedAt = endedAt;
    r.durationSeconds = durationSeconds;
    return r;
  }
  const { rows } = await pool.query(
    `UPDATE calls
     SET status = 'ended', ended_at = $2, duration_seconds = $3
     WHERE sid = $1
     RETURNING *`,
    [sid, endedAt, durationSeconds],
  );
  return rows.length ? rowToRecord(rows[0]) : null;
}

async function dbAddEmotion(sid: string, entry: EmotionEntry): Promise<void> {
  if (!pool) {
    const r = memCalls.get(sid);
    if (r) r.emotions.push(entry);
    return;
  }
  await pool.query(
    `UPDATE calls
     SET emotions = emotions || $2::jsonb
     WHERE sid = $1`,
    [sid, JSON.stringify([entry])],
  );
}

function generateSid(): string {
  return `CA${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// v1 routes (legacy)
// ---------------------------------------------------------------------------

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'AI Thunderbolt Pro API', database: DATABASE_URL ? 'configured' : 'not configured' });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'AI Thunderbolt Pro API is running' });
});

// ---------------------------------------------------------------------------
// v2 routes
// ---------------------------------------------------------------------------

// GET /api/v2/health
app.get('/api/v2/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: 'v2', service: 'AI Thunderbolt Pro API', database: DATABASE_URL ? 'configured' : 'not configured' });
});

// POST /api/v2/calls/start
app.post('/api/v2/calls/start', async (req: Request, res: Response) => {
  try {
    const sid = generateSid();
    const record: CallRecord = {
      sid,
      status: 'active',
      startedAt: new Date().toISOString(),
      emotions: [],
    };
    await dbInsertCall(record);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error starting call:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v2/calls/:sid/end
app.post('/api/v2/calls/:sid/end', async (req: Request, res: Response) => {
  try {
    const { sid } = req.params;
    const record = await dbGetCall(sid);
    if (!record) {
      res.status(404).json({ error: 'Call not found', sid });
      return;
    }
    if (record.status === 'ended') {
      res.status(409).json({ error: 'Call already ended', sid });
      return;
    }
    const endedAt = new Date().toISOString();
    const durationSeconds = Math.round(
      (new Date(endedAt).getTime() - new Date(record.startedAt).getTime()) / 1000,
    );
    const updated = await dbEndCall(sid, endedAt, durationSeconds);
    res.json(updated);
  } catch (err) {
    console.error('Error ending call:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v2/calls/:sid
app.get('/api/v2/calls/:sid', async (req: Request, res: Response) => {
  try {
    const { sid } = req.params;
    const record = await dbGetCall(sid);
    if (!record) {
      res.status(404).json({ error: 'Call not found', sid });
      return;
    }
    res.json(record);
  } catch (err) {
    console.error('Error getting call:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v2/calls/:sid/emotion
app.post('/api/v2/calls/:sid/emotion', async (req: Request, res: Response) => {
  try {
    const { sid } = req.params;
    const record = await dbGetCall(sid);
    if (!record) {
      res.status(404).json({ error: 'Call not found', sid });
      return;
    }
    if (record.status === 'ended') {
      res.status(409).json({ error: 'Cannot add emotion data to an ended call', sid });
      return;
    }
    const { emotion, confidence, sentiment } = req.body as {
      emotion?: string;
      confidence?: number;
      sentiment?: 'positive' | 'negative' | 'neutral';
    };
    const validSentiments = ['positive', 'negative', 'neutral'];
    if (!emotion || typeof emotion !== 'string') {
      res.status(400).json({ error: 'emotion must be a non-empty string' });
      return;
    }
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
      res.status(400).json({ error: 'confidence must be a number between 0 and 1' });
      return;
    }
    if (!sentiment || !validSentiments.includes(sentiment)) {
      res.status(400).json({ error: 'sentiment must be one of: positive, negative, neutral' });
      return;
    }
    const entry: EmotionEntry = {
      emotion,
      confidence,
      sentiment,
      timestamp: new Date().toISOString(),
    };
    await dbAddEmotion(sid, entry);
    res.status(201).json(entry);
  } catch (err) {
    console.error('Error adding emotion:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v2/calls
app.get('/api/v2/calls', async (_req: Request, res: Response) => {
  try {
    res.json(await dbListCalls());
  } catch (err) {
    console.error('Error listing calls:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

if (require.main === module) {
  initDb()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Database: ${DATABASE_URL ? 'PostgreSQL (DATABASE_URL set)' : 'in-memory (DATABASE_URL not set)'}`);
      });

      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} is already in use`);
        } else {
          console.error('Server error:', err.message);
        }
        process.exit(1);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

export { initDb };
export default app;
