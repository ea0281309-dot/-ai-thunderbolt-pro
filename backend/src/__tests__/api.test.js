const request = require('supertest');
const app = require('../index');

describe('Health endpoint', () => {
  it('GET /health returns 200 with ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('AI Thunderbolt Pro');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.timestamp).toBeTruthy();
  });
});

describe('Calls API', () => {
  it('GET /api/calls returns empty list initially', async () => {
    const res = await request(app).get('/api/calls');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.calls)).toBe(true);
  });

  it('POST /api/calls creates a new call', async () => {
    const res = await request(app)
      .post('/api/calls')
      .send({ phoneNumber: '+15551234567', voiceProfile: 'professional' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.phoneNumber).toBe('+15551234567');
    expect(res.body.status).toBe('queued');
  });

  it('POST /api/calls returns 400 without phoneNumber', async () => {
    const res = await request(app).post('/api/calls').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('GET /api/calls/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/calls/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('Analysis API', () => {
  it('POST /api/analysis/emotion analyzes emotion from text', async () => {
    const res = await request(app)
      .post('/api/analysis/emotion')
      .send({ text: 'I am happy and love this great product!' });
    expect(res.status).toBe(200);
    expect(res.body.analysis).toBeTruthy();
    expect(res.body.analysis.dominantEmotion).toBeTruthy();
    expect(res.body.analysis.confidence).toBeGreaterThan(0);
  });

  it('POST /api/analysis/emotion returns 400 without text', async () => {
    const res = await request(app).post('/api/analysis/emotion').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/analysis/sentiment analyzes sentiment', async () => {
    const res = await request(app)
      .post('/api/analysis/sentiment')
      .send({ text: 'This is terrible and awful.' });
    expect(res.status).toBe(200);
    expect(res.body.sentiment.label).toBe('negative');
  });

  it('POST /api/analysis/call-quality returns quality metrics', async () => {
    const res = await request(app)
      .post('/api/analysis/call-quality')
      .send({ transcript: 'Hello how are you doing today', duration: 60 });
    expect(res.status).toBe(200);
    expect(res.body.quality.overallScore).toBeTruthy();
    expect(res.body.quality.grade).toBeTruthy();
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Route not found');
  });
});
