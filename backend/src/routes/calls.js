const { Router } = require("express");
const router = Router();

// In-memory store for demo purposes
const calls = [];

// GET /api/calls — list all calls
router.get("/", (_req, res) => {
  res.json({ calls });
});

// POST /api/calls — initiate a new AI call
router.post("/", (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: "Fields 'to' and 'message' are required." });
  }
  const call = {
    id: `call_${Date.now()}`,
    to,
    message,
    status: "queued",
    createdAt: new Date().toISOString(),
  };
  calls.push(call);
  res.status(201).json({ call });
});

// GET /api/calls/:id — get call status
router.get("/:id", (req, res) => {
  const call = calls.find((c) => c.id === req.params.id);
  if (!call) return res.status(404).json({ error: "Call not found." });
  res.json({ call });
});

module.exports = router;
