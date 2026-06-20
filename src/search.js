const { HttpError } = require("./errors");

// Default search result limit to prevent ResponseTooLargeError
const DEFAULT_SEARCH_LIMIT = 50;
const MAX_SEARCH_LIMIT = 100;

/**
 * Detects if a query should trigger an exact job number search.
 * Checks for query.jobNumber, query.number, query.id, or query.q (if digits-only).
 * Returns the job number string if detected, null otherwise.
 * 
 * Important: This returns the job NUMBER (e.g., "1869"), NOT the internal JobNimbus ID.
 * The job number must be used to search/filter, not as a direct read ID.
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
function summarizeJobRecord(record) {
  if (!record || typeof record !== "object") return record;

  // Return lightweight summary with only essential fields
  return {
    id: record.id || record.jnid,
    job_number: record.jobNumber || record.job_number || record.number,
    name: record.name || record.description,
    customer: record.customer || record.customerName,
    address: record.address || record.street_address,
    city: record.city,
    state: record.state,
    zip: record.zip || record.postal_code,
    phone: record.phone,
    email: record.email,
    status: record.status,
    createdAt: record.createdAt || record.created_at,
    updatedAt: record.updatedAt || record.updated_at
  };
}

/**
 * Summarizes a full JobNimbus contact record to a lightweight summary.
 */
function summarizeContactRecord(record) {
  if (!record || typeof record !== "object") return record;

  return {
    id: record.id || record.jnid,
    name: record.name || `${record.firstName || ''} ${record.lastName || ''}`.trim(),
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    phone: record.phone,
    address: record.address,
    city: record.city,
    state: record.state,
    zip: record.zip || record.postal_code,
    status: record.status,
    createdAt: record.createdAt || record.created_at,
    updatedAt: record.updatedAt || record.updated_at
  };
}

/**
 * Caps and summarizes search results to prevent large responses.
 * Returns a standardized response format with count, returned, and results.
 */
function cappedSummaryResults(result, resource = "job", limit = DEFAULT_SEARCH_LIMIT) {
  if (!result) return { count: 0, returned: 0, results: [] };

  let records = [];

  // Handle array response
  if (Array.isArray(result)) {
    records = result.slice(0, limit);
  }
  // Handle paginated response { results: [...], total: N }
  else if (result.results && Array.isArray(result.results)) {
    records = result.results.slice(0, limit);
  }
  // Handle single record response (from direct lookup)
  else {
    records = [result];
  }

  // Summarize based on resource type
  const summarizer = resource === "contact" ? summarizeContactRecord : summarizeJobRecord;
  const summarized = records.map(summarizer);

  return {
    count: summarized.length,
    returned: summarized.length,
    results: summarized
  };
}

/**
 * Filters results by exact job number match.
 * Returns matching records in the standardized response format.
 */
function filterByJobNumber(results, jobNumber) {
  if (!Array.isArray(results)) return { count: 0, returned: 0, results: [] };

  const jobNum = String(jobNumber);
  const matches = results.filter(r => {
    const recordJobNumber = String(r.job_number || r.jobNumber || r.number || "");
    return recordJobNumber === jobNum;
  });

  return {
    count: matches.length,
    returned: matches.length,
    results: matches.map(summarizeJobRecord)
  };
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
  summarizeJobRecord,
  summarizeContactRecord,
  cappedSummaryResults,
  filterByJobNumber,
  isResponseTooLargeError,
  DEFAULT_SEARCH_LIMIT,
  MAX_SEARCH_LIMIT
};
