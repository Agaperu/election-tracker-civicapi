const CIVIC_BASE = "https://civicapi.org/api/v2";

export async function civicFetch(url) {
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

export async function getStatusData() {
  return civicFetch(`${CIVIC_BASE}/status`);
}

export async function searchRaces(query = {}) {
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
    if (query[key] !== undefined && query[key] !== "") {
      params.set(key, query[key]);
    }
  }

  return civicFetch(`${CIVIC_BASE}/race/search?${params.toString()}`);
}

export async function getRaceData(raceId, query = {}) {
  const params = new URLSearchParams();

  for (const key of ["generateMap", "generateMapPNG", "data", "embed", "precinct"]) {
    if (query[key] !== undefined && query[key] !== "") {
      params.set(key, query[key]);
    }
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return civicFetch(`${CIVIC_BASE}/race/${encodeURIComponent(raceId)}${suffix}`);
}

export async function getRaceHistoryData(raceId, timestamp) {
  const url = timestamp
    ? `${CIVIC_BASE}/race/${encodeURIComponent(raceId)}/history/${encodeURIComponent(timestamp)}`
    : `${CIVIC_BASE}/race/${encodeURIComponent(raceId)}/history/`;

  return civicFetch(url);
}

export function proxyErrorPayload(errorName, e) {
  return {
    statusCode: e.status || 500,
    body: {
      error: errorName,
      message: e.message,
      details: e.body
    }
  };
}
