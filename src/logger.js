/**
 * Simple logger for search and error tracking.
 * Logs to console with timestamps.
 */

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, message, data = {}) {
  const timestamp = formatTimestamp();
  const entry = {
    timestamp,
    level,
    message,
    ...data
  };
  console.log(JSON.stringify(entry));
}

function info(message, data = {}) {
  log("INFO", message, data);
}

function warn(message, data = {}) {
  log("WARN", message, data);
}

function error(message, data = {}) {
  log("ERROR", message, data);
}

function logSearch(resource, query, resultCount, duration, success = true) {
  const level = success ? "INFO" : "WARN";
  log(level, "Search executed", {
    resource,
    query: JSON.stringify(query),
    resultCount,
    durationMs: duration,
    success
  });
}

function logSearchError(resource, query, error, duration) {
  log("ERROR", "Search failed", {
    resource,
    query: JSON.stringify(query),
    errorCode: error.code,
    errorMessage: error.message,
    errorStatus: error.status,
    durationMs: duration
  });
}

module.exports = {
  info,
  warn,
  error,
  logSearch,
  logSearchError
};
