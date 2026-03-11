/**
 * index.ts – Server entry point for AI Thunderbolt Pro backend
 */

import express from "express";
import cors from "cors";
import voicesRouter from "./routes/voices";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Voice management API
app.use("/api/voices", voicesRouter);

app.listen(PORT, () => {
  console.log(`AI Thunderbolt Pro server listening on port ${PORT}`);
});

export default app;
