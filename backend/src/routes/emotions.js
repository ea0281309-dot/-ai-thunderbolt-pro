const { Router } = require("express");
const router = Router();

// Emotion labels the AI can detect
const EMOTIONS = ["happy", "sad", "angry", "anxious", "neutral", "excited", "frustrated"];

// POST /api/emotions/analyze — analyze text for emotional content
router.post("/analyze", (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Field 'text' is required." });
  }
  // Simulated emotion analysis (replace with real AI model integration)
  const detected = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
  const confidence = parseFloat((0.6 + Math.random() * 0.39).toFixed(2));
  res.json({
    text,
    emotion: detected,
    confidence,
    analyzedAt: new Date().toISOString(),
  });
});

// GET /api/emotions — return supported emotions
router.get("/", (_req, res) => {
  res.json({ emotions: EMOTIONS });
});

module.exports = router;
