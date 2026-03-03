async function apiGet(path, params = {}) {
  const url = new URL(path, window.location.origin);
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
  health: () => apiGet("/api/health"),
  status: () => apiGet("/api/status"),
  searchRaces: (filters) => apiGet("/api/race/search", filters),
  getRace: (raceId, opts = {}) => apiGet(`/api/race/${encodeURIComponent(raceId)}`, opts),
  getHistory: (raceId, timestamp) =>
    apiGet(`/api/race/${encodeURIComponent(raceId)}/history`, timestamp ? { timestamp } : {})
};
