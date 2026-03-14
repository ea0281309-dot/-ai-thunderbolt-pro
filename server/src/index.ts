import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({ origin: allowedOrigins }));
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

// In-memory call store (replace with a database in production)
const calls = new Map<string, CallRecord>();

function generateSid(): string {
  return `CA${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// v1 routes (legacy)
// ---------------------------------------------------------------------------

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'AI Thunderbolt Pro API' });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'AI Thunderbolt Pro API is running' });
});

// ---------------------------------------------------------------------------
// v2 routes
// ---------------------------------------------------------------------------

// GET /api/v2/health
app.get('/api/v2/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: 'v2', service: 'AI Thunderbolt Pro API' });
});

// POST /api/v2/calls/start
app.post('/api/v2/calls/start', (req: Request, res: Response) => {
  const sid = generateSid();
  const record: CallRecord = {
    sid,
    status: 'active',
    startedAt: new Date().toISOString(),
    emotions: [],
  };
  calls.set(sid, record);
  res.status(201).json(record);
});

// POST /api/v2/calls/:sid/end
app.post('/api/v2/calls/:sid/end', (req: Request, res: Response) => {
  const { sid } = req.params;
  const record = calls.get(sid);
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
  record.status = 'ended';
  record.endedAt = endedAt;
  record.durationSeconds = durationSeconds;
  res.json(record);
});

// GET /api/v2/calls/:sid
app.get('/api/v2/calls/:sid', (req: Request, res: Response) => {
  const { sid } = req.params;
  const record = calls.get(sid);
  if (!record) {
    res.status(404).json({ error: 'Call not found', sid });
    return;
  }
  res.json(record);
});

// POST /api/v2/calls/:sid/emotion
app.post('/api/v2/calls/:sid/emotion', (req: Request, res: Response) => {
  const { sid } = req.params;
  const record = calls.get(sid);
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
  record.emotions.push(entry);
  res.status(201).json(entry);
});

// GET /api/v2/calls
app.get('/api/v2/calls', (_req: Request, res: Response) => {
  res.json(Array.from(calls.values()));
});

if (require.main === module) {
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
}

export default app;
