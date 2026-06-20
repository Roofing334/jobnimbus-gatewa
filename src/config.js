const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function loadPermissions() {
  const permissionsPath = path.join(__dirname, "..", "config", "permissions.json");
  return JSON.parse(fs.readFileSync(permissionsPath, "utf8"));
}

function loadConfig() {
  loadEnvFile(path.join(__dirname, "..", ".env"));

  return {
    port: Number(process.env.PORT || 8787),
    jobNimbusBaseUrl: process.env.JOBNIMBUS_BASE_URL || "https://app.jobnimbus.com/api1",
    jobNimbusApiKey: process.env.JOBNIMBUS_API_KEY || "",
    permissions: loadPermissions()
  };
}

module.exports = { loadConfig };
