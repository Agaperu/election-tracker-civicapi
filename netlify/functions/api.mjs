import {
  getRaceData,
  getRaceHistoryData,
  getStatusData,
  proxyErrorPayload,
  searchRaces
} from "../../server/civicProxy.js";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  };
}

function text(statusCode, body, contentType = "text/plain; charset=utf-8") {
  return {
    statusCode,
    headers: {
      "content-type": contentType
    },
    body
  };
}

function routeParts(path) {
  return path
    .replace(/^\/\.netlify\/functions\/api\/?/, "")
    .split("/")
    .filter(Boolean);
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "method_not_allowed", message: "Only GET is supported." });
  }

  const parts = routeParts(event.path);
  const query = event.queryStringParameters || {};

  try {
    if (parts.length === 1 && parts[0] === "health") {
      return json(200, { ok: true });
    }

    if (parts.length === 1 && parts[0] === "status") {
      return json(200, await getStatusData());
    }

    if (parts.length === 2 && parts[0] === "race" && parts[1] === "search") {
      return json(200, await searchRaces(query));
    }

    if (parts.length === 3 && parts[0] === "race" && parts[2] === "history") {
      return json(200, await getRaceHistoryData(parts[1], query.timestamp));
    }

    if (parts.length === 2 && parts[0] === "race") {
      const data = await getRaceData(parts[1], query);

      if (typeof data === "string") {
        return text(200, data);
      }

      return json(200, data);
    }

    return json(404, { error: "not_found", message: "Unknown API route." });
  } catch (e) {
    const error = proxyErrorPayload("netlify_proxy_failed", e);
    return json(error.statusCode, error.body);
  }
}
