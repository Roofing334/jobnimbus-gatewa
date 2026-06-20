const test = require("node:test");
const assert = require("node:assert/strict");
const { assertAllowed, scopedSearchParams } = require("../src/permissions");

const employee = {
  name: "Ian Miller",
  agent: "Ian Miller Sales Assistant",
  allow: ["job:search"],
  approvalRequired: ["record:delete"],
  scope: {
    assignedOnly: true,
    salesRepNames: ["Ian Miller"]
  }
};

test("allowed actions pass", () => {
  assert.doesNotThrow(() => assertAllowed(employee, "job:search"));
});

test("approval actions are rejected with approval_required", () => {
  assert.throws(() => assertAllowed(employee, "record:delete"), /approval/);
});

test("assigned-only employees get search scope added", () => {
  assert.deepEqual(scopedSearchParams(employee, { q: "Smith" }), {
    q: "Smith",
    sales_rep_names: ["Ian Miller"]
  });
});
