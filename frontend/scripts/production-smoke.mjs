#!/usr/bin/env node

const baseUrl = (process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001").replace(/\/$/, "");

const checks = [];

async function check(name, run) {
  try {
    await run();
    checks.push({ name, status: "PASS" });
  } catch (error) {
    checks.push({ name, status: "FAIL", message: error instanceof Error ? error.message : String(error) });
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

await check("landing page loads", async () => {
  const response = await fetch(`${baseUrl}/`);
  expect(response.ok, `expected 2xx, got ${response.status}`);
});

await check("login page loads", async () => {
  const response = await fetch(`${baseUrl}/login`);
  expect(response.ok, `expected 2xx, got ${response.status}`);
});

await check("learn route loads", async () => {
  const response = await fetch(`${baseUrl}/learn`);
  expect(response.ok, `expected 2xx, got ${response.status}`);
});

await check("security headers present", async () => {
  const response = await fetch(`${baseUrl}/learn`);
  expect(response.headers.get("x-content-type-options") === "nosniff", "missing X-Content-Type-Options: nosniff");
  expect(response.headers.get("x-frame-options") === "DENY", "missing X-Frame-Options: DENY");
  expect(response.headers.get("referrer-policy") === "strict-origin-when-cross-origin", "missing Referrer-Policy");
});

await check("anonymous challenge SQL is blocked", async () => {
  const response = await fetch(`${baseUrl}/api/query/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ challengeId: 1, query: "SELECT * FROM Customers" }),
  });
  expect(response.status === 401, `expected 401, got ${response.status}`);
});

await check("anonymous sandbox SQL is blocked", async () => {
  const response = await fetch(`${baseUrl}/api/query/free`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "SELECT * FROM Customers" }),
  });
  expect(response.status === 401, `expected 401, got ${response.status}`);
});

const failures = checks.filter((item) => item.status === "FAIL");
for (const item of checks) {
  const suffix = item.message ? ` - ${item.message}` : "";
  console.log(`${item.status} ${item.name}${suffix}`);
}

if (failures.length) {
  console.error(`\n${failures.length} production smoke check(s) failed for ${baseUrl}.`);
  process.exit(1);
}

console.log(`\nProduction smoke checks passed for ${baseUrl}.`);