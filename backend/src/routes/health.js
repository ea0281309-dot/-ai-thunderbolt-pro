const express = require('express');
const router = express.Router();

const startTime = Date.now();

/**
 * GET /health
 * Health check endpoint for Railway deployment monitoring
 */
router.get('/', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: 'ok',
    service: 'AI Thunderbolt Pro',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
