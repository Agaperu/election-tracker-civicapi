import express from "express";
import cors from "cors";
import {
  getRaceData,
  getRaceHistoryData,
  getStatusData,
  proxyErrorPayload,
  searchRaces
} from "./civicProxy.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5179;

// Tiny in-memory rate limiter (helps you stay under 40/min guideline) :contentReference[oaicite:5]{index=5}
const windowMs = 60_000;
const maxPerWindow = 38; // keep a little margin
let bucket = [];

function rateLimit(req, res, next) {
  const now = Date.now();
  bucket = bucket.filter((t) => now - t < windowMs);
  if (bucket.length >= maxPerWindow) {
    res.status(429).json({
      error: "rate_limited",
      message: "Too many requests this minute. Slow polling or reduce searches."
    });
    return;
  }
  bucket.push(now);
  next();
}

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// civicAPI status endpoint :contentReference[oaicite:6]{index=6}
app.get("/api/status", rateLimit, async (_req, res) => {
  try {
    const data = await getStatusData();
    res.json(data);
  } catch (e) {
    const error = proxyErrorPayload("status_failed", e);
    res.status(error.statusCode).json(error.body);
  }
});

// Race search endpoint :contentReference[oaicite:7]{index=7}
// Mirrors civicAPI: /race/search?startDate=...&endDate=...&query=...&country=...&province=...&district=...&election_type=...&limit=...
app.get("/api/race/search", rateLimit, async (req, res) => {
  try {
    const data = await searchRaces(req.query);
    res.json(data);
  } catch (e) {
    const error = proxyErrorPayload("search_failed", e);
    res.status(error.statusCode).json(error.body);
  }
});

// Get race by ID :contentReference[oaicite:8]{index=8}
app.get("/api/race/:raceId", rateLimit, async (req, res) => {
  try {
    const { raceId } = req.params;
    const data = await getRaceData(raceId, req.query);

    // If user asked for map PNG/SVG or CSV, civicAPI may return non-JSON. We handle both.
    if (typeof data === "string") {
      res.type("text/plain").send(data);
    } else {
      res.json(data);
    }
  } catch (e) {
    const error = proxyErrorPayload("race_failed", e);
    res.status(error.statusCode).json(error.body);
  }
});

// Race history timestamps / snapshot :contentReference[oaicite:10]{index=10}
app.get("/api/race/:raceId/history", rateLimit, async (req, res) => {
  try {
    const { raceId } = req.params;
    const data = await getRaceHistoryData(raceId, req.query.timestamp);
    res.json(data);
  } catch (e) {
    const error = proxyErrorPayload("history_failed", e);
    res.status(error.statusCode).json(error.body);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
});
