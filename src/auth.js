const crypto = require("node:crypto");
const { HttpError } = require("./errors");

function safeEqual(left, right) {
  const a = Buffer.from(left || "");
  const b = Buffer.from(right || "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return "";
  return token.trim();
}

function authenticate(req, permissions) {
  const token = getBearerToken(req);
  if (!token) {
    throw new HttpError(401, "missing_token", "Missing Authorization header. Use Bearer <gateway key>.");
  }

  for (const employee of permissions.employees) {
    const expected = process.env[employee.gatewayKeyEnv];
    if (expected && safeEqual(token, expected)) {
      return employee;
    }
  }

  throw new HttpError(401, "invalid_token", "Gateway key is invalid or not configured.");
}

module.exports = { authenticate };
