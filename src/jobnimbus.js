const { HttpError } = require("./errors");

function buildUrl(baseUrl, endpoint, query = undefined) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanEndpoint = String(endpoint || "").replace(/^\/+/, "");
  const url = new URL(`${cleanBase}/${cleanEndpoint}`);

  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, item);
      } else {
        url.searchParams.set(key, value);
      }
    }
  }

  return url;
}

function buildAuthHeaders(config) {
  const authScheme = process.env.JOBNIMBUS_AUTH_SCHEME || "api-key";

  if (authScheme.toLowerCase() === "token") {
    return { "Authorization": `token ${config.jobNimbusApiKey}` };
  }

  if (authScheme.toLowerCase() === "bearer") {
    return { "Authorization": `Bearer ${config.jobNimbusApiKey}` };
  }

  if (authScheme.toLowerCase() === "api-key") {
    return { "X-API-Key": config.jobNimbusApiKey };
  }

  return { "Authorization": config.jobNimbusApiKey };
}

async function callJobNimbus(config, { method, endpoint, query, data }) {
  if (!config.jobNimbusApiKey) {
    throw new HttpError(500, "missing_jobnimbus_key", "JOBNIMBUS_API_KEY is not configured.");
  }

  const url = buildUrl(config.jobNimbusBaseUrl, endpoint, query);
  const response = await fetch(url, {
    method,
    headers: {
      ...buildAuthHeaders(config),
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: data === undefined ? undefined : JSON.stringify(data)
  });

  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new HttpError(response.status, "jobnimbus_error", "JobNimbus returned an error.", {
      status: response.status,
      body
    });
  }

  return body;
}

module.exports = { buildUrl, callJobNimbus };
