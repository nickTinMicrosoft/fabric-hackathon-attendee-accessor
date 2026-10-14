import { app } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import { createAllocator } from "./allocator.mjs";
import { createHandler, loadConfig } from "./http.mjs";

const config = loadConfig(process.env);
if (!process.env.TABLE_SERVICE_URL?.startsWith("https://")) throw new Error("TABLE_SERVICE_URL must use HTTPS");
const table = new TableClient(process.env.TABLE_SERVICE_URL, config.tableName, new DefaultAzureCredential());
app.http("claim", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: createHandler(config, createAllocator(table, config.eventId, config.reservedNumbers))
});
