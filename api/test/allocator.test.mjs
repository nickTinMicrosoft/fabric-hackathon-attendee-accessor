import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { TableClient, TableServiceClient } from "@azure/data-tables";
import { createAllocator, PoolFullError } from "../src/allocator.mjs";

const token = () => randomBytes(32).toString("hex");

function memoryTable() {
  const rows = new Map();
  return {
    rows,
    async getEntity(partition, key) {
      const entity = rows.get(`${partition}/${key}`);
      if (!entity) throw Object.assign(new Error("Not found"), { statusCode: 404 });
      return entity;
    },
    async submitTransaction(actions) {
      await new Promise((resolve) => setImmediate(resolve));
      for (const [, entity] of actions) {
        if (rows.has(`${entity.partitionKey}/${entity.rowKey}`)) throw Object.assign(new Error("Conflict"), { statusCode: 409 });
      }
      for (const [, entity] of actions) rows.set(`${entity.partitionKey}/${entity.rowKey}`, entity);
    }
  };
}

async function exercisePool(table, eventId) {
  const allocate = createAllocator(table, eventId);
  const tokens = Array.from({ length: 75 }, token);
  const results = await Promise.allSettled(tokens.map(allocate));
  const assigned = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
  assert.equal(assigned.length, 50);
  assert.deepEqual([...assigned].sort((a, b) => a - b), Array.from({ length: 50 }, (_, i) => i + 1));
  const failed = results.filter((result) => result.status === "rejected");
  assert.equal(failed.length, 25);
  failed.forEach((result) => assert.ok(result.reason instanceof PoolFullError));
  const successfulIndex = results.findIndex((result) => result.status === "fulfilled");
  assert.equal(await allocate(tokens[successfulIndex]), results[successfulIndex].value);
}

test("75 simultaneous attendees receive exactly 50 unique accounts; full-pool recovery is idempotent", async () => {
  await exercisePool(memoryTable(), "test");
});

test("50 concurrent retries for one attendee consume only one slot", async () => {
  const table = memoryTable();
  const allocate = createAllocator(table, "retry");
  const sharedToken = token();
  const numbers = await Promise.all(Array.from({ length: 50 }, () => allocate(sharedToken)));
  assert.deepEqual([...new Set(numbers)], [1]);
  assert.equal(table.rows.size, 2);
  assert.equal(await allocate(token()), 2);
});

test("event namespaces are isolated", async () => {
  const table = memoryTable();
  assert.equal(await createAllocator(table, "event1")(token()), 1);
  assert.equal(await createAllocator(table, "event2")(token()), 1);
});

test("facilitator-assigned accounts are excluded from automatic allocation", async () => {
  const allocate = createAllocator(memoryTable(), "reserved", [1, 3, 50]);
  assert.equal(await allocate(token()), 2);
  assert.equal(await allocate(token()), 4);
  const closed = createAllocator(memoryTable(), "all-reserved", Array.from({ length: 50 }, (_, i) => i + 1));
  await assert.rejects(closed(token()), PoolFullError);
});

test("invalid tokens and storage failures do not produce an assignment", async () => {
  await assert.rejects(createAllocator(memoryTable(), "test")("bad"), TypeError);
  const table = { async getEntity() { throw Object.assign(new Error("offline"), { statusCode: 503 }); } };
  await assert.rejects(createAllocator(table, "test")(token()), /offline/);
  const writeFailure = memoryTable();
  writeFailure.submitTransaction = async () => { throw new Error("write unavailable"); };
  await assert.rejects(createAllocator(writeFailure, "test")(token()), /write unavailable/);
});

test("lost response can be retried without consuming another account", async () => {
  const table = memoryTable();
  const submit = table.submitTransaction.bind(table);
  let first = true;
  table.submitTransaction = async (actions) => {
    const result = await submit(actions);
    if (first) { first = false; throw new Error("Response lost after commit"); }
    return result;
  };
  const allocate = createAllocator(table, "retry");
  const attendee = token();
  await assert.rejects(allocate(attendee), /Response lost/);
  assert.equal(await allocate(attendee), 1);
  assert.equal(table.rows.size, 2);
});

test("Azurite: real Azure Table transactions under concurrent claims", { skip: !process.env.AZURITE_CONNECTION_STRING, timeout: 180000 }, async () => {
  const connection = process.env.AZURITE_CONNECTION_STRING;
  const name = `test${randomBytes(8).toString("hex")}`;
  const service = TableServiceClient.fromConnectionString(connection, { allowInsecureConnection: true });
  await service.createTable(name);
  const table = TableClient.fromConnectionString(connection, name, { allowInsecureConnection: true });
  try {
    await exercisePool(table, "integration");
    const allocate = createAllocator(table, "same-token");
    const attendee = token();
    const results = await Promise.all(Array.from({ length: 20 }, () => allocate(attendee)));
    assert.deepEqual([...new Set(results)], [1]);
    let rows = 0;
    for await (const row of table.listEntities({ queryOptions: { filter: "PartitionKey eq 'same-token'" } })) rows++;
    assert.equal(rows, 2);
  } finally {
    await service.deleteTable(name);
  }
});
