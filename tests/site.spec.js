import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile, readdir } from "node:fs/promises";
import { transform } from "lightningcss";

test("homepage presents the actual goals, download, and all document links", async ({ page, request }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("From scattered data.");
  await expect(page.locator(".goal-card")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Download code & notebooks" })).toHaveAttribute("href", /archive\/refs\/heads\/main.zip$/);
  const links = await page.locator('a[href*="/Documents/"]').evaluateAll((items) => [...new Set(items.map((item) => item.href.split("#")[0]))]);
  for (const link of links) expect((await request.get(link)).status(), link).toBe(200);
  expect(errors).toEqual([]);
});

test("manual credential helper validates range, uses exact UPN, and never persists passwords", async ({ page }) => {
  await page.goto("./");
  await page.locator("#user-number").fill("12");
  await page.getByRole("button", { name: "Use number" }).click();
  await expect(page.locator("#account-upn")).toHaveValue("Fabric.User12.malv26@estdcorp.onmicrosoft.com");
  await expect(page.locator("#account-password")).toHaveAttribute("type", "password");
  await page.locator("#account-password").fill("private-test-value");
  await page.getByLabel("Show password", { exact: true }).check();
  await expect(page.locator("#account-password")).toHaveAttribute("type", "text");
  expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain("private-test-value");
  await expect(page.locator("#access-status")).toContainText("not an online reservation");
  await page.reload();
  await expect(page.locator("#credentials")).toBeHidden();
  await page.locator("#user-number").fill("51");
  await page.getByRole("button", { name: "Use number" }).click();
  await expect(page.locator("#credentials")).toBeHidden();
});

test("unconfigured allocation is explicit and never guesses or assigns a number", async ({ page }) => {
  await page.goto("./");
  await page.locator("#claim-details summary").click();
  await expect(page.locator("#allocation-setup")).toBeVisible();
  await expect(page.locator("#claim-form")).toBeHidden();
});

test("goal and readiness progress survives reload, reset preserves reservation token", async ({ page }) => {
  await page.goto("./");
  await page.locator("#goal-1 summary").first().click();
  for (const input of await page.locator('[data-goal="1"]').all()) await input.check();
  await page.locator('[data-progress="ready-workspace"]').check();
  await expect(page.locator("#progress-label")).toHaveText("1 of 4 goals complete");
  await page.reload();
  await expect(page.locator("#progress-label")).toHaveText("1 of 4 goals complete");
  await expect(page.locator('[data-progress="ready-workspace"]')).toBeChecked();
  await page.evaluate(() => localStorage.setItem("fabric-field-lab-claim-v1", "a".repeat(64)));
  await page.getByRole("button", { name: "Reset checklist" }).click();
  await expect(page.locator("#goal-progress")).toHaveJSProperty("value", 0);
  expect(await page.evaluate(() => localStorage.getItem("fabric-field-lab-claim-v1"))).toBe("a".repeat(64));
});

test("all four goals can be completed and full progress is measurable", async ({ page }) => {
  await page.goto("./");
  for (const goal of await page.locator(".goal-card").all()) {
    await goal.locator("summary").first().click();
    for (const input of await goal.locator("[data-goal]").all()) await input.check();
  }
  await expect(page.locator("#progress-label")).toHaveText("4 of 4 goals complete");
  await expect(page.locator("#goal-progress")).toHaveJSProperty("value", 4);
  await expect(page.locator(".goal-state.complete")).toHaveCount(4);
});

test("homepage and guide are accessible and have no horizontal overflow", async ({ page }) => {
  for (const url of ["./", "Documents/Fabric%20Hackathon%20-%20Goal%202.html"]) {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (url !== "./") await expect(page.locator('[aria-current="page"]')).toHaveText(/Build the Silver layer/);
  }
});

test("downloads and guides remain usable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.getByRole("link", { name: "Download code & notebooks" })).toBeVisible();
  await page.getByRole("link", { name: "Open Goal 1", exact: false }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Goal 1: Connect SQL, Cosmos DB, and ADLS Gen2");
  await context.close();
});

async function configureApi(page, respond) {
  await page.route("**/assets/site.js", async (route) => {
    const source = await readFile(new URL("../assets/site.js", import.meta.url), "utf8");
    await route.fulfill({
      contentType: "text/javascript",
      body: `document.querySelector("[data-access-api]").dataset.accessApi = "https://allocation.example.test/api/claim";\n${source}`
    });
  });
  await page.route("https://allocation.example.test/api/claim", respond);
  await page.goto("./");
  await page.locator("#claim-details summary").click();
  await page.locator("#event-code").fill("test-code-not-production");
}

test("online claim returns credentials, recovers token, and disables manual switching", async ({ page }) => {
  const tokens = [];
  await configureApi(page, async (route) => {
    tokens.push(route.request().postDataJSON().token);
    await route.fulfill({ json: { number: 24, password: "runtime-test-secret" } });
  });
  await page.locator("#claim-button").click();
  await expect(page.locator("#account-upn")).toHaveValue("Fabric.User24.malv26@estdcorp.onmicrosoft.com");
  await expect(page.locator("#account-password")).toHaveValue("runtime-test-secret");
  await expect(page.locator("#user-number")).toBeDisabled();
  await expect(page.locator("#event-code")).toHaveValue("");
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("runtime-test-secret");
  await page.reload();
  await page.locator("#claim-details summary").click();
  await page.locator("#event-code").fill("test-code-not-production");
  await page.locator("#claim-button").click();
  await expect(page.locator("#account-upn")).toHaveValue("Fabric.User24.malv26@estdcorp.onmicrosoft.com");
  expect(tokens).toHaveLength(2);
  expect(tokens[0]).toBe(tokens[1]);
});

test("full pool, bad event codes, and network failure show honest errors without a fallback account", async ({ page }) => {
  let status = 409;
  await configureApi(page, async (route) => {
    if (status === 0) { await route.abort(); return; }
    await route.fulfill({ status, json: { error: "test" } });
  });
  for (const [value, message] of [[409, "All 50 accounts are reserved"], [401, "event code was not accepted"], [503, "temporarily unavailable"], [0, "Could not reach"]]) {
    status = value;
    await page.locator("#claim-button").click();
    await expect(page.locator("#access-status")).toContainText(message);
    await expect(page.locator("#credentials")).toBeHidden();
    await expect(page.locator("#claim-button")).toBeEnabled();
  }
});

test("blocked browser storage prevents claiming instead of consuming an unrecoverable slot", async ({ page }) => {
  let requests = 0;
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("Storage blocked"); }; });
  await configureApi(page, async (route) => { requests++; await route.abort(); });
  await page.locator("#claim-button").click();
  await expect(page.locator("#access-status")).toHaveClass(/error/);
  expect(requests).toBe(0);
});

test("two simultaneous tabs share a single reservation token", async ({ page, context }) => {
  const tokens = [];
  const respond = async (route) => {
    tokens.push(route.request().postDataJSON().token);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({ json: { number: 7, password: "test-tab-password" } });
  };
  const other = await context.newPage();
  await configureApi(page, respond);
  await configureApi(other, respond);
  await Promise.all([page.locator("#claim-button").click(), other.locator("#claim-button").click()]);
  await expect(page.locator("#account-upn")).toHaveValue("Fabric.User7.malv26@estdcorp.onmicrosoft.com");
  await expect(other.locator("#account-upn")).toHaveValue("Fabric.User7.malv26@estdcorp.onmicrosoft.com");
  expect(tokens).toHaveLength(2);
  expect(new Set(tokens).size).toBe(1);
  await other.close();
});

test("CSS parses without syntax warnings", async () => {
  const code = await readFile(new URL("../assets/site.css", import.meta.url));
  const result = transform({ filename: "site.css", code, errorRecovery: false });
  expect(result.warnings).toEqual([]);
});

test("every guide chapter has working local document and notebook links", async ({ page, request }) => {
  const names = (await readdir(new URL("../Documents/", import.meta.url))).filter((name) => name.endsWith(".md") && name !== "README.md");
  for (const name of names) {
    await page.goto(`Documents/${encodeURIComponent(name.replace(/\.md$/, ".html"))}`);
    const links = await page.locator("a[href]").evaluateAll((items) => items.map((item) => item.href).filter((url) => url.startsWith(location.origin)));
    for (const link of [...new Set(links)]) expect((await request.get(link.split("#")[0])).status(), link).toBe(200);
  }
});
