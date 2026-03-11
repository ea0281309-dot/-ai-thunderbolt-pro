const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const emotionService = require('../services/emotionService');

// In-memory store (replace with a database in production)
const calls = new Map();

/**
 * GET /api/calls
 * List all calls
 */
router.get('/', (req, res) => {
  const callList = Array.from(calls.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ calls: callList, total: callList.length });
});

/**
 * GET /api/calls/:id
 * Get a specific call by ID
 */
router.get('/:id', (req, res) => {
  const call = calls.get(req.params.id);
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }
  res.json(call);
});

/**
 * POST /api/calls
 * Initiate a new AI call
 */
router.post('/', (req, res) => {
  const { phoneNumber, script, voiceProfile, language } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'phoneNumber is required' });
  }

  const call = {
    id: uuidv4(),
    phoneNumber,
    script: script || null,
    voiceProfile: voiceProfile || 'professional',
    language: language || 'en-US',
    status: 'queued',
    emotionScore: null,
    transcript: null,
    duration: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  calls.set(call.id, call);

  // Simulate call processing
  setTimeout(() => {
    const stored = calls.get(call.id);
    if (stored) {
      stored.status = 'completed';
      stored.duration = Math.floor(Math.random() * 180) + 30;
      stored.emotionScore = emotionService.generateMockEmotionScore();
      stored.transcript = 'Call transcript would appear here in production.';
      stored.updatedAt = new Date().toISOString();
      calls.set(call.id, stored);
    }
  }, 5000);

  res.status(201).json(call);
});

/**
 * PUT /api/calls/:id/status
 * Update call status
 */
router.put('/:id/status', (req, res) => {
  const call = calls.get(req.params.id);
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }

  const { status } = req.body;
  const validStatuses = ['queued', 'in-progress', 'completed', 'failed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  call.status = status;
  call.updatedAt = new Date().toISOString();
  calls.set(call.id, call);

  res.json(call);
});

/**
 * DELETE /api/calls/:id
 * Delete a call record
 */
router.delete('/:id', (req, res) => {
  if (!calls.has(req.params.id)) {
    return res.status(404).json({ error: 'Call not found' });
  }
  calls.delete(req.params.id);
  res.status(204).send();
});

module.exports = router;
