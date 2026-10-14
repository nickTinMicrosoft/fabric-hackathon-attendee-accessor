import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler, loadConfig } from "../src/http.mjs";
import { PoolFullError } from "../src/allocator.mjs";

const env = {
  EVENT_ID: "test-event", EVENT_CODE: "test-event-code-not-for-production",
  LAB_PASSWORD: "test-only-placeholder", ALLOWED_ORIGIN: "https://example.test",
  EVENT_END_UTC: "2099-01-01T00:00:00Z", TABLE_NAME: "AttendeeClaims"
};
const config = loadConfig(env);
const token = "a".repeat(64);
const context = { error() {} };
const request = (overrides = {}) => new Request("https://api.example.test/api/claim", {
  method: "POST", headers: { origin: config.origin, "content-type": "application/json" },
  body: JSON.stringify({ token, eventCode: config.eventCode }), ...overrides
});

test("valid request returns credentials with no-store and exact CORS origin", async () => {
  const result = await createHandler(config, async (received) => { assert.equal(received, token); return 12; })(request(), context);
  assert.equal(result.status, 200);
  assert.deepEqual(result.jsonBody, { number: 12, password: env.LAB_PASSWORD });
  assert.equal(result.headers["Cache-Control"], "no-store, private");
  assert.equal(result.headers["Access-Control-Allow-Origin"], config.origin);
});

test("missing or wrong event code never calls allocator or exposes password", async () => {
  let calls = 0;
  const handler = createHandler(config, async () => { calls++; });
  for (const body of [{ token }, { token, eventCode: "wrong" }, null, [], { token, eventCode: 42 }]) {
    const result = await handler(request({ body: JSON.stringify(body) }), context);
    assert.equal(result.status, 401);
    assert.ok(!JSON.stringify(result).includes(config.password));
  }
  assert.equal(calls, 0);
});

test("disallowed origins and closed events cannot claim", async () => {
  const handler = createHandler(config, async () => { throw new Error("must not allocate"); });
  const wrongOrigin = await handler(request({ headers: { origin: "https://other.test" } }), context);
  assert.equal(wrongOrigin.status, 403);
  assert.equal(wrongOrigin.headers["Access-Control-Allow-Origin"], undefined);
  assert.equal((await createHandler(config, async () => 1, () => config.end)(request(), context)).status, 403);
});

test("preflight is credential-free and allows only POST", async () => {
  const result = await createHandler(config, async () => 1)(request({ method: "OPTIONS", body: undefined }), context);
  assert.equal(result.status, 204);
  assert.equal(result.headers["Access-Control-Allow-Methods"], "POST, OPTIONS");
  assert.equal(result.jsonBody, undefined);
});

test("malformed, oversized, non-JSON, invalid tokens, and wrong methods fail explicitly", async () => {
  const handler = createHandler(config, async () => { throw new Error("must not allocate"); });
  const cases = [
    [{ body: "{" }, 400],
    [{ body: JSON.stringify({ eventCode: config.eventCode, token: "bad" }) }, 400],
    [{ body: "x".repeat(2050) }, 413],
    [{ headers: { origin: config.origin, "content-type": "text/plain" } }, 415],
    [{ method: "GET", body: undefined }, 405]
  ];
  for (const [input, expected] of cases) assert.equal((await handler(request(input), context)).status, expected);
});

test("full pool and storage errors return explicit failures without credentials or secret logs", async () => {
  assert.equal((await createHandler(config, async () => { throw new PoolFullError(); })(request(), context)).status, 409);
  const logs = [];
  const result = await createHandler(config, async () => { throw new Error("storage failure"); })(request(), { error(...args) { logs.push(args); } });
  assert.equal(result.status, 503);
  for (const secret of [config.password, config.eventCode, token]) {
    assert.ok(!JSON.stringify([result, logs]).includes(secret));
  }
});

test("deployment fails fast for absent or unsafe settings", () => {
  assert.throws(() => loadConfig({}), /Missing required setting/);
  assert.throws(() => loadConfig({ ...env, EVENT_CODE: "short" }), /16-256/);
  assert.throws(() => loadConfig({ ...env, ALLOWED_ORIGIN: "*" }), /Invalid URL/);
  assert.throws(() => loadConfig({ ...env, ALLOWED_ORIGIN: "https://example.test/path" }), /origin/);
  assert.throws(() => loadConfig({ ...env, EVENT_END_UTC: "tomorrow" }), /UTC/);
  assert.throws(() => loadConfig({ ...env, EVENT_ID: "../test" }), /EVENT_ID/);
  assert.throws(() => loadConfig({ ...env, LAB_PASSWORD: "@Microsoft.KeyVault(SecretUri=https://example.test/secret)" }), /Unresolved Key Vault/);
  assert.throws(() => loadConfig({ ...env, RESERVED_USER_NUMBERS: "0,51" }), /RESERVED_USER_NUMBERS/);
  assert.deepEqual(loadConfig({ ...env, RESERVED_USER_NUMBERS: "1, 50" }).reservedNumbers, [1, 50]);
});
