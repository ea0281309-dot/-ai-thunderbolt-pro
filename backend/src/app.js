const express = require("express");
const cors = require("cors");
const callRoutes = require("./routes/calls");
const emotionRoutes = require("./routes/emotions");
const healthRoutes = require("./routes/health");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// CORS — allow frontend origin (set ALLOWED_ORIGIN in Railway env vars)
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/emotions", emotionRoutes);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
