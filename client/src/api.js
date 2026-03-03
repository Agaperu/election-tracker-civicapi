const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window.location.hostname === "localhost" ? "/api" : "/.netlify/functions/api");

async function apiGet(path, params = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE}${normalizedPath}`, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      url.searchParams.set(k, v);
    }
  });

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

  if (!res.ok) {
    const message = isJson ? body?.message || body?.error || "Request failed" : String(body || "Request failed");
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export const civicApi = {
  health: () => apiGet("/health"),
  status: () => apiGet("/status"),
  searchRaces: (filters) => apiGet("/race/search", filters),
  getRace: (raceId, opts = {}) => apiGet(`/race/${encodeURIComponent(raceId)}`, opts),
  getHistory: (raceId, timestamp) =>
    apiGet(`/race/${encodeURIComponent(raceId)}/history`, timestamp ? { timestamp } : {})
};
