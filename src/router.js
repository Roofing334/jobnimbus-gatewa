const { authenticate } = require("./auth");
const { HttpError } = require("./errors");
const { callJobNimbus } = require("./jobnimbus");
const { assertAllowed, redactEmployee, scopedSearchParams } = require("./permissions");

async function parseJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body, null, 2));
}

function getPath(req) {
  return new URL(req.url, "http://localhost").pathname;
}

function endpointForResource(resource, id = undefined) {
  if (resource === "contact") {
    return id ? `contacts/${encodeURIComponent(id)}` : "contacts";
  }

  if (resource === "job") {
    return id ? `jobs/${encodeURIComponent(id)}` : "jobs";
  }

  throw new HttpError(400, "invalid_resource", "Resource must be either contact or job.");
}

async function handleRequest(req, res, config) {
  const path = getPath(req);

  if (req.method === "GET" && path === "/health") {
    sendJson(res, 200, { ok: true, service: "jobnimbus-gateway" });
    return;
  }

  if (req.method === "GET" && path === "/me") {
    const employee = authenticate(req, config.permissions);
    sendJson(res, 200, { ok: true, employee: redactEmployee(employee) });
    return;
  }

  if (req.method !== "POST") {
    throw new HttpError(405, "method_not_allowed", "Use POST for gateway actions.");
  }

  const employee = authenticate(req, config.permissions);
  const body = await parseJson(req);

  if (path === "/jobnimbus/search") {
    const resource = String(body.resource || "");
    const query = body.query && typeof body.query === "object" ? body.query : {};
    const action = `${resource}:search`;
    assertAllowed(employee, action);

    const result = await callJobNimbus(config, {
      method: "GET",
      endpoint: endpointForResource(resource),
      query: scopedSearchParams(employee, query)
    });

    sendJson(res, 200, { ok: true, employee: redactEmployee(employee), action, result });
    return;
  }

  if (path === "/jobnimbus/read") {
    const resource = String(body.resource || "");
    const id = String(body.id || "");
    if (!id) throw new HttpError(400, "missing_id", "Provide the JobNimbus record id.");

    const action = `${resource}:read`;
    assertAllowed(employee, action);

    const endpoint = endpointForResource(resource, id);
    const result = await callJobNimbus(config, { method: "GET", endpoint });

    sendJson(res, 200, { ok: true, employee: redactEmployee(employee), action, result });
    return;
  }

  if (path === "/jobnimbus/task") {
    const data = body.data && typeof body.data === "object" ? body.data : {};
    assertAllowed(employee, "task:create");

    const result = await callJobNimbus(config, { method: "POST", endpoint: "tasks", data });
    sendJson(res, 201, { ok: true, employee: redactEmployee(employee), action: "task:create", result });
    return;
  }

  if (path === "/jobnimbus/task/status") {
    const id = String(body.id || "");
    const status = body.status;
    if (!id || !status) throw new HttpError(400, "missing_task_status", "Provide task id and status.");
    assertAllowed(employee, "task:update_status");

    const result = await callJobNimbus(config, {
      method: "PATCH",
      endpoint: `tasks/${encodeURIComponent(id)}`,
      data: { status }
    });

    sendJson(res, 200, { ok: true, employee: redactEmployee(employee), action: "task:update_status", result });
    return;
  }

  if (path === "/jobnimbus/note") {
    const data = body.data && typeof body.data === "object" ? body.data : {};
    assertAllowed(employee, "note:create");

    const result = await callJobNimbus(config, { method: "POST", endpoint: "notes", data });
    sendJson(res, 201, { ok: true, employee: redactEmployee(employee), action: "note:create", result });
    return;
  }

  throw new HttpError(404, "not_found", "Gateway route was not found.");
}

function errorHandler(res, error) {
  const status = error.status || 500;
  sendJson(res, status, {
    ok: false,
    error: {
      code: error.code || "internal_error",
      message: error.message || "Internal server error.",
      details: error.details
    }
  });
}

module.exports = { handleRequest, errorHandler };
