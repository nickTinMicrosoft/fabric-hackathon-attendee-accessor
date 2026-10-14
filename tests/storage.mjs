import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { setTimeout } from "node:timers/promises";

const require = createRequire(import.meta.url);
const directory = await mkdtemp(path.join(os.tmpdir(), "fabric-claims-"));
const port = await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => { const value = server.address().port; server.close(() => resolve(value)); });
});
const emulator = spawn(process.execPath, [
  require.resolve("azurite/dist/src/table/main.js"), "--silent", "--skipApiVersionCheck",
  "--tableHost", "127.0.0.1", "--tablePort", String(port), "--location", directory
], {
  env: { ...process.env, AZURITE_ACCOUNTS: "hackathontest:dGVzdC1vbmx5LWVtdWxhdG9yLWtleQ==" },
  stdio: ["ignore", "pipe", "pipe"]
});
let output = "";
emulator.stdout.on("data", (data) => { output += data; });
emulator.stderr.on("data", (data) => { output += data; });
let ready = false;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (emulator.exitCode !== null) throw new Error(`Azurite exited: ${output}`);
    ready = await new Promise((resolve) => {
      const socket = net.connect({ host: "127.0.0.1", port });
      socket.once("connect", () => { socket.destroy(); resolve(true); });
      socket.once("error", () => { socket.destroy(); resolve(false); });
    });
    if (ready) break;
    await setTimeout(100);
  }
  if (!ready) throw new Error(`Azurite did not start: ${output}`);
  const child = spawn(process.execPath, ["--test", "api/test/allocator.test.mjs"], {
    env: { ...process.env, AZURITE_CONNECTION_STRING: `DefaultEndpointsProtocol=http;AccountName=hackathontest;AccountKey=dGVzdC1vbmx5LWVtdWxhdG9yLWtleQ==;TableEndpoint=http://127.0.0.1:${port}/hackathontest;` },
    stdio: "inherit"
  });
  process.exitCode = await new Promise((resolve) => child.once("exit", (code) => resolve(code ?? 1)));
} finally {
  const exit = new Promise((resolve) => emulator.once("exit", resolve));
  if (emulator.exitCode === null) { emulator.kill(); await exit; }
  await rm(directory, { recursive: true, force: true });
}
