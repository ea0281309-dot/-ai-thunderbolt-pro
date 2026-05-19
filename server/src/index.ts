import express, { Request, Response } from 'express';
import cors from 'cors';

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

interface EmotionPayload {
  emotion?: string;
  confidence?: number;
  sentiment?: string;
}

// In-memory call store (replace with a database in production)
const calls = new Map<string, CallRecord>();
const validSentiments = new Set<EmotionEntry['sentiment']>(['positive', 'negative', 'neutral']);

function generateSid(): string {
  return `CA${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

function sendError(res: Response, status: number, error: string): Response {
  return res.status(status).json({ error });
}

function getCallRecord(sid: string): CallRecord | null {
  return calls.get(sid) ?? null;
}

function getSidParam(req: Request, res: Response): string | null {
  const sid = req.params.sid.trim();
  if (!sid) {
    sendError(res, 400, 'sid is required');
    return null;
  }

  return sid;
}

function validateEmotionPayload(body: EmotionPayload):
  | { ok: true; emotion: string; confidence: number; sentiment: EmotionEntry['sentiment'] }
  | { ok: false; error: string } {
  if (typeof body.emotion !== 'string' || !body.emotion.trim()) {
    return { ok: false, error: 'emotion must be a non-empty string' };
  }

  if (typeof body.confidence !== 'number' || !Number.isFinite(body.confidence)) {
    return { ok: false, error: 'confidence must be a finite number between 0 and 1' };
  }

  if (body.confidence < 0 || body.confidence > 1) {
    return { ok: false, error: 'confidence must be a finite number between 0 and 1' };
  }

  if (typeof body.sentiment !== 'string' || !validSentiments.has(body.sentiment as EmotionEntry['sentiment'])) {
    return { ok: false, error: 'sentiment must be one of: positive, negative, neutral' };
  }

  return {
    ok: true,
    emotion: body.emotion.trim(),
    confidence: body.confidence,
    sentiment: body.sentiment as EmotionEntry['sentiment'],
  };
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
  const sid = getSidParam(req, res);
  if (!sid) return;

  const record = getCallRecord(sid);
  if (!record) {
    sendError(res, 404, 'Call not found');
    return;
  }
  if (record.status === 'ended') {
    sendError(res, 409, 'Call already ended');
    return;
  }
  const endedAt = new Date();
  const durationSeconds = Math.round(
    (endedAt.getTime() - new Date(record.startedAt).getTime()) / 1000,
  );
  record.status = 'ended';
  record.endedAt = endedAt.toISOString();
  record.durationSeconds = durationSeconds;
  res.json(record);
});

// GET /api/v2/calls/:sid
app.get('/api/v2/calls/:sid', (req: Request, res: Response) => {
  const sid = getSidParam(req, res);
  if (!sid) return;

  const record = getCallRecord(sid);
  if (!record) {
    sendError(res, 404, 'Call not found');
    return;
  }
  res.json(record);
});

// POST /api/v2/calls/:sid/emotion
app.post('/api/v2/calls/:sid/emotion', (req: Request, res: Response) => {
  const sid = getSidParam(req, res);
  if (!sid) return;

  const record = getCallRecord(sid);
  if (!record) {
    sendError(res, 404, 'Call not found');
    return;
  }
  if (record.status === 'ended') {
    sendError(res, 409, 'Cannot add emotion data to an ended call');
    return;
  }

  const validation = validateEmotionPayload(req.body as EmotionPayload);
  if (!validation.ok) {
    sendError(res, 400, validation.error);
    return;
  }
  const entry: EmotionEntry = {
    emotion: validation.emotion,
    confidence: validation.confidence,
    sentiment: validation.sentiment,
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
    console.log(`Database: ${DATABASE_URL ? 'configured (DATABASE_URL set)' : 'not configured (DATABASE_URL not set)'}`);
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
