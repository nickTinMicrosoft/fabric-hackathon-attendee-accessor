import { createHash, timingSafeEqual } from "node:crypto";
import { PoolFullError } from "./allocator.mjs";

const digest = (value) => createHash("sha256").update(value).digest();
const sameSecret = (left, right) => timingSafeEqual(digest(left), digest(right));

export function loadConfig(env) {
  const required = ["EVENT_ID", "EVENT_CODE", "LAB_PASSWORD", "ALLOWED_ORIGIN", "EVENT_END_UTC", "TABLE_NAME"];
  for (const key of required) {
    if (!env[key]?.trim()) throw new Error(`Missing required setting: ${key}`);
    if (env[key].startsWith("@Microsoft.KeyVault(")) throw new Error(`Unresolved Key Vault reference: ${key}`);
  }
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(env.EVENT_ID)) throw new Error("Invalid EVENT_ID");
  if (!/^[A-Za-z][A-Za-z0-9]{2,62}$/.test(env.TABLE_NAME)) throw new Error("Invalid TABLE_NAME");
  if (env.EVENT_CODE.length < 16 || env.EVENT_CODE.length > 256) throw new Error("EVENT_CODE must contain 16-256 characters");
  const origin = new URL(env.ALLOWED_ORIGIN);
  if (origin.protocol !== "https:" || origin.origin !== env.ALLOWED_ORIGIN) throw new Error("ALLOWED_ORIGIN must be an HTTPS origin without a path or trailing slash");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(env.EVENT_END_UTC) ||
      !Number.isFinite(Date.parse(env.EVENT_END_UTC))) throw new Error("EVENT_END_UTC must be an ISO UTC timestamp");
  const reservedNumbers = env.RESERVED_USER_NUMBERS ? env.RESERVED_USER_NUMBERS.split(",").map((part) => {
    if (!/^\s*(?:[1-9]|[1-4]\d|50)\s*$/.test(part)) throw new Error("RESERVED_USER_NUMBERS must be comma-separated numbers from 1 to 50");
    return Number(part);
  }) : [];
  return {
    eventId: env.EVENT_ID, eventCode: env.EVENT_CODE, password: env.LAB_PASSWORD,
    origin: origin.origin, end: Date.parse(env.EVENT_END_UTC), tableName: env.TABLE_NAME,
    reservedNumbers
  };
}

export function createHandler(config, allocate, now = Date.now) {
  return async (request, context) => {
    const headers = {
      "Cache-Control": "no-store, private",
      "Pragma": "no-cache",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff"
    };
    const reply = (status, error) => ({ status, headers, jsonBody: { error } });
    if (request.headers.get("origin") !== config.origin) return reply(403, "Origin not allowed");
    headers["Access-Control-Allow-Origin"] = config.origin;
    if (request.method === "OPTIONS") {
      headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "Content-Type";
      return { status: 204, headers };
    }
    if (request.method !== "POST") return reply(405, "Use POST");
    if (now() >= config.end) return reply(403, "Event is closed");
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply(415, "Use application/json");
    const length = Number(request.headers.get("content-length"));
    if (length > 2048) return reply(413, "Request too large");
    let body;
    try {
      const text = await request.text();
      if (Buffer.byteLength(text) > 2048) return reply(413, "Request too large");
      body = JSON.parse(text);
    } catch {
      return reply(400, "Invalid JSON");
    }
    if (!body || typeof body.eventCode !== "string" || body.eventCode.length > 256 ||
        !sameSecret(body.eventCode, config.eventCode)) return reply(401, "Invalid event code");
    if (typeof body.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token)) return reply(400, "Invalid reservation token");
    try {
      const number = await allocate(body.token);
      return { status: 200, headers, jsonBody: { number, password: config.password } };
    } catch (error) {
      if (error instanceof PoolFullError) return reply(409, "All accounts are reserved");
      // Do not log request bodies, event codes, tokens, or returned credentials.
      context.error("Account allocation failed", { code: error.code ?? "STORAGE_FAILURE" });
      return reply(503, "Reservation unavailable; retry with the same token");
    }
  };
}
