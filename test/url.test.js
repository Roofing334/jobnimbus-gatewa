const test = require("node:test");
const assert = require("node:assert/strict");
const { buildUrl } = require("../src/jobnimbus");

test("buildUrl strips duplicate slashes and appends query params", () => {
  const url = buildUrl("https://example.test/api1/", "/jobs", { q: "Smith", sales_rep_names: ["Ian Miller"] });

  assert.equal(url.toString(), "https://example.test/api1/jobs?q=Smith&sales_rep_names=Ian+Miller");
});
