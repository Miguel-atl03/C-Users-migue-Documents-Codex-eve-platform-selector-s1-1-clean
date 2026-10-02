import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "eve-b0-opcion-b-flujo-horizontal-mockup.html");
const pngPath = path.join(__dirname, "eve-b0-opcion-b-flujo-horizontal-mockup.png");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
  waitUntil: "networkidle",
});

await page.waitForTimeout(1200);

await page.screenshot({
  path: pngPath,
  fullPage: false,
  type: "png",
});

await browser.close();
console.log(`PNG exported: ${pngPath}`);
