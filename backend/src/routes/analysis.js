const express = require('express');
const router = express.Router();
const emotionService = require('../services/emotionService');

/**
 * POST /api/analysis/emotion
 * Analyze emotion from text or audio transcript
 */
router.post('/emotion', (req, res) => {
  const { text, callId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text is required for emotion analysis' });
  }

  const analysis = emotionService.analyzeEmotion(text);
  res.json({
    callId: callId || null,
    text,
    analysis,
    analyzedAt: new Date().toISOString(),
  });
});

/**
 * POST /api/analysis/sentiment
 * Analyze sentiment from text
 */
router.post('/sentiment', (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text is required for sentiment analysis' });
  }

  const sentiment = emotionService.analyzeSentiment(text);
  res.json({
    text,
    sentiment,
    analyzedAt: new Date().toISOString(),
  });
});

/**
 * POST /api/analysis/call-quality
 * Analyze call quality metrics
 */
router.post('/call-quality', (req, res) => {
  const { transcript, duration, emotionScores } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: 'transcript is required' });
  }

  const quality = emotionService.analyzeCallQuality(transcript, duration, emotionScores);
  res.json({
    quality,
    analyzedAt: new Date().toISOString(),
  });
});

module.exports = router;
