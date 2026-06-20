const { HttpError } = require("./errors");

// Default search result limit to prevent ResponseTooLargeError
const DEFAULT_SEARCH_LIMIT = 50;
const MAX_SEARCH_LIMIT = 100;

/**
 * Detects if a query is an exact job number lookup.
 * Checks for query.jobNumber, query.number, query.id, or query.q (if digits-only).
 * Returns the job ID if detected, null otherwise.
 */
function detectExactJobNumberLookup(resource, query) {
  if (resource !== "job") return null;
  if (!query || typeof query !== "object") return null;

  // Check for job number (numeric identifier) - prioritize explicit jobNumber field
  const jobNumber = query.jobNumber || query.number || query.id;
  if (jobNumber && typeof jobNumber === "string" && /^\d+$/.test(jobNumber.trim())) {
    return jobNumber.trim();
  }

  // Check if query.q is digits-only (from GPT tool)
  if (query.q && typeof query.q === "string" && /^\d+$/.test(query.q.trim())) {
    return query.q.trim();
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
 * Summarizes a full JobNimbus record to a lightweight summary.
 * Returns only essential fields to minimize response size.
 */
function summarizeRecord(record) {
  if (!record || typeof record !== "object") return record;

  // Return lightweight summary with only essential fields
  return {
    id: record.id,
    name: record.name || record.firstName,
    address: record.address,
    city: record.city,
    state: record.state,
    zip: record.zip,
    phone: record.phone,
    email: record.email,
    status: record.status,
    jobNumber: record.jobNumber || record.number,
    createdAt: record.createdAt || record.created_at,
    updatedAt: record.updatedAt || record.updated_at
  };
}

/**
 * Caps and summarizes search results to prevent large responses.
 */
function cappedSummaryResults(result, limit = DEFAULT_SEARCH_LIMIT) {
  if (!result) return [];

  // Handle array response
  if (Array.isArray(result)) {
    return result.slice(0, limit).map(summarizeRecord);
  }

  // Handle paginated response { results: [...], total: N }
  if (result.results && Array.isArray(result.results)) {
    return result.results.slice(0, limit).map(summarizeRecord);
  }

  // Handle single record response (from direct lookup)
  return [summarizeRecord(result)];
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
  cappedSummaryResults,
  isResponseTooLargeError,
  DEFAULT_SEARCH_LIMIT,
  MAX_SEARCH_LIMIT
};
