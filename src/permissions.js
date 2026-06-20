const { HttpError } = require("./errors");

function hasPermission(employee, action) {
  return Array.isArray(employee.allow) && employee.allow.includes(action);
}

function requiresApproval(employee, action) {
  return Array.isArray(employee.approvalRequired) && employee.approvalRequired.includes(action);
}

function assertAllowed(employee, action) {
  if (hasPermission(employee, action)) return;

  if (requiresApproval(employee, action)) {
    throw new HttpError(403, "approval_required", "This action requires Eric/admin approval before the gateway will run it.", {
      employee: employee.name,
      agent: employee.agent,
      action
    });
  }

  throw new HttpError(403, "permission_denied", "This employee is not allowed to perform this JobNimbus action.", {
    employee: employee.name,
    agent: employee.agent,
    action
  });
}

function scopedSearchParams(employee, params) {
  if (!employee.scope || !employee.scope.assignedOnly) return params;

  return {
    ...params,
    sales_rep_names: employee.scope.salesRepNames
  };
}

function redactEmployee(employee) {
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    agent: employee.agent,
    scope: employee.scope,
    allow: employee.allow,
    approvalRequired: employee.approvalRequired
  };
}

module.exports = { assertAllowed, scopedSearchParams, redactEmployee };
