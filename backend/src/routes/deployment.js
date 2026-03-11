const express = require('express');
const router = express.Router();

/**
 * GET /api/deployment
 * Returns the live deployment URLs for the AI Thunderbolt Pro services.
 * Set VERCEL_URL and RAILWAY_STATIC_URL (or RAILWAY_PUBLIC_DOMAIN) as environment
 * variables in your production environment. Railway injects RAILWAY_STATIC_URL
 * automatically; Vercel injects VERCEL_URL automatically on preview/production.
 */
router.get('/', (req, res) => {
  const railwayUrl =
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : process.env.RAILWAY_STATIC_URL
        ? `https://${process.env.RAILWAY_STATIC_URL}`
        : process.env.BACKEND_URL || null;

  const vercelUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  res.status(200).json({
    frontend: {
      platform: 'Vercel',
      url: vercelUrl,
    },
    backend: {
      platform: 'Railway',
      url: railwayUrl,
    },
    instructions: {
      railway: 'Deploy the /backend directory to Railway. Railway auto-injects RAILWAY_STATIC_URL.',
      vercel:
        'Deploy the /frontend directory to Vercel. Set NEXT_PUBLIC_BACKEND_URL to the Railway URL.',
    },
  });
});

module.exports = router;
