import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const baseURL = process.env.EVE_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir =
  process.env.OFFICIAL_CCP_CAPTURE_DIR ??
  join(process.env.USERPROFILE ?? ".", "Downloads", "cierre_gaps_unidad1_capturas");

const path = "/admin/official-consultant-control-panel?mode=client-company&view=monitoring";

const viewports = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "tablet", width: 768, height: 1024, mobile: true },
  { name: "mobile", width: 390, height: 844, mobile: true },
];

mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  baseURL,
  ...devices["Desktop Chrome"],
});
await context.addCookies([
  {
    name: "eve_consultant_role",
    value: "consultant",
    domain: "127.0.0.1",
    path: "/",
  },
]);

for (const viewport of viewports) {
  const page = await context.newPage();
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(path);
  await page.waitForSelector("text=Panel de Control EVE");
  await page.screenshot({
    path: join(outputDir, `${viewport.name}.png`),
    fullPage: false,
  });
  await page.close();
}

await browser.close();
console.log(`Capturas guardadas en: ${outputDir}`);
