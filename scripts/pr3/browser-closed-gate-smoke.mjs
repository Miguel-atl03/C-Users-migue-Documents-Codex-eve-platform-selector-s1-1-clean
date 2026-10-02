import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "../..");
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto("http://127.0.0.1:3001/pr3-pilot", { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    await page.getByRole("status").waitFor();
    assert.equal(await page.getByRole("status").textContent(), "El acceso al piloto permanece cerrado.");
    const layout = await page.evaluate(() => ({ width: innerWidth, contentWidth: document.documentElement.scrollWidth }));
    assert.ok(layout.contentWidth <= layout.width);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(root, `.tmp/p4-${name}-closed-gate.png`), fullPage: true });
    results.push({ viewport: name, result: "PASS", horizontal_overflow: false, page_errors: errors });
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(root, ".tmp/p4-browser-closed-gate.json"), `${JSON.stringify({ result: "PASS", results }, null, 2)}\n`);
console.log(JSON.stringify({ result: "PASS", results }, null, 2));
