const { HttpError } = require("./errors");

// Default search result limit to prevent ResponseTooLargeError
const DEFAULT_SEARCH_LIMIT = 50;
const MAX_SEARCH_LIMIT = 100;

/**
 * Detects if a query is an exact job number lookup.
 * Returns the job ID if detected, null otherwise.
 */
function detectExactJobNumberLookup(resource, query) {
  if (resource !== "job") return null;
  if (!query || typeof query !== "object") return null;

  // Check for job number (numeric identifier)
  const jobNumber = query.jobNumber || query.number || query.id;
  if (jobNumber && typeof jobNumber === "string" && /^\d+$/.test(jobNumber.trim())) {
    return jobNumber.trim();
  }

  return null;
}

/**
 * Applies lightweight defaults to search parameters.
 * Caps results, removes expensive fields, enforces pagination.
 */
function applyLightweightDefaults(query) {
  const params = { ...query };

  // Cap the limit
  if (!params.limit) {
    params.limit = DEFAULT_SEARCH_LIMIT;
  } else {
    const limit = parseInt(params.limit, 10);
    if (limit > MAX_SEARCH_LIMIT) {
      params.limit = MAX_SEARCH_LIMIT;
    }
  }

  // Ensure offset/skip exists for pagination
  if (!params.offset && !params.skip) {
    params.offset = 0;
  }

  return params;
}

/**
 * Checks if an error is a ResponseTooLargeError from JobNimbus.
 */
function isResponseTooLargeError(error) {
  if (!error || !error.details) return false;

  const body = error.details.body;
  if (!body) return false;

  // Check for JobNimbus error responses
  if (typeof body === "object") {
    const errorType = body.error?.type || body.errorType || body.code;
    return (
      errorType === "ResponseTooLargeError" ||
      errorType === "response_too_large" ||
      (body.message && body.message.includes("ResponseTooLarge"))
    );
  }

  if (typeof body === "string") {
    return body.includes("ResponseTooLarge");
  }

  return false;
}

module.exports = {
  detectExactJobNumberLookup,
  applyLightweightDefaults,
  isResponseTooLargeError,
  DEFAULT_SEARCH_LIMIT,
  MAX_SEARCH_LIMIT
};
