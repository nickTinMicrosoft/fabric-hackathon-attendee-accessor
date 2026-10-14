import { createHash } from "node:crypto";

export class PoolFullError extends Error {}

function statusOf(error) {
  return error.statusCode ?? error.response?.status;
}

export function createAllocator(table, eventId, reservedNumbers = []) {
  const reserved = new Set(reservedNumbers);
  const attendeeKey = (token) => `attendee-${createHash("sha256").update(token).digest("hex")}`;
  const lookup = async (rowKey) => {
    try {
      return await table.getEntity(eventId, rowKey);
    } catch (error) {
      if (statusOf(error) === 404) return null;
      throw error;
    }
  };

  return async (token) => {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new TypeError("Invalid reservation token");
    const rowKey = attendeeKey(token);
    const previous = await lookup(rowKey);
    if (previous) return previous.number;
    for (let number = 1; number <= 50; number++) {
      if (reserved.has(number)) continue;
      try {
        // Both rows share a partition: Azure commits both creates or neither.
        await table.submitTransaction([
          ["create", { partitionKey: eventId, rowKey: `slot-${String(number).padStart(2, "0")}`, number }],
          ["create", { partitionKey: eventId, rowKey, number }]
        ]);
        return number;
      } catch (error) {
        if (statusOf(error) !== 409) throw error;
        const existing = await lookup(rowKey);
        if (existing) return existing.number;
      }
    }
    // A concurrent request for the same token may have claimed the last slot.
    const final = await lookup(rowKey);
    if (final) return final.number;
    throw new PoolFullError("All accounts are reserved");
  };
}
