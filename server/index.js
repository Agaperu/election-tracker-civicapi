import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5179;

// civicAPI v2 base URL per docs :contentReference[oaicite:4]{index=4}
const CIVIC_BASE = "https://civicapi.org/api/v2";

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

async function civicFetch(url) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "civicapi-election-dashboard/1.0"
    }
  });

  const contentType = resp.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!resp.ok) {
    const body = isJson ? await resp.json().catch(() => ({})) : await resp.text().catch(() => "");
    const message =
      typeof body === "string" ? body : body?.message || body?.error || "Request failed";
    const err = new Error(message);
    err.status = resp.status;
    err.body = body;
    throw err;
  }

  return isJson ? resp.json() : resp.text();
}

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// civicAPI status endpoint :contentReference[oaicite:6]{index=6}
app.get("/api/status", rateLimit, async (_req, res) => {
  try {
    const data = await civicFetch(`${CIVIC_BASE}/status`);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: "status_failed", message: e.message, details: e.body });
  }
});

// Race search endpoint :contentReference[oaicite:7]{index=7}
// Mirrors civicAPI: /race/search?startDate=...&endDate=...&query=...&country=...&province=...&district=...&election_type=...&limit=...
app.get("/api/race/search", rateLimit, async (req, res) => {
  try {
    const params = new URLSearchParams();
    for (const key of [
      "startDate",
      "endDate",
      "query",
      "country",
      "province",
      "district",
      "election_type",
      "limit"
    ]) {
      if (req.query[key] !== undefined && req.query[key] !== "") {
        params.set(key, req.query[key]);
      }
    }
    const data = await civicFetch(`${CIVIC_BASE}/race/search?${params.toString()}`);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: "search_failed", message: e.message, details: e.body });
  }
});

// Get race by ID :contentReference[oaicite:8]{index=8}
app.get("/api/race/:raceId", rateLimit, async (req, res) => {
  try {
    const { raceId } = req.params;

    // Pass-through optional query params civicAPI supports:
    // generateMap, generateMapPNG, data=csv|json, embed, precinct :contentReference[oaicite:9]{index=9}
    const params = new URLSearchParams();
    for (const key of ["generateMap", "generateMapPNG", "data", "embed", "precinct"]) {
      if (req.query[key] !== undefined && req.query[key] !== "") {
        params.set(key, req.query[key]);
      }
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    const data = await civicFetch(`${CIVIC_BASE}/race/${encodeURIComponent(raceId)}${suffix}`);

    // If user asked for map PNG/SVG or CSV, civicAPI may return non-JSON. We handle both.
    if (typeof data === "string") {
      res.type("text/plain").send(data);
    } else {
      res.json(data);
    }
  } catch (e) {
    res.status(e.status || 500).json({ error: "race_failed", message: e.message, details: e.body });
  }
});

// Race history timestamps / snapshot :contentReference[oaicite:10]{index=10}
app.get("/api/race/:raceId/history", rateLimit, async (req, res) => {
  try {
    const { raceId } = req.params;
    // If ?timestamp=... provided, fetch that snapshot, else fetch list
    const ts = req.query.timestamp;

    const url = ts
      ? `${CIVIC_BASE}/race/${encodeURIComponent(raceId)}/history/${encodeURIComponent(ts)}`
      : `${CIVIC_BASE}/race/${encodeURIComponent(raceId)}/history/`;

    const data = await civicFetch(url);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: "history_failed", message: e.message, details: e.body });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
});
