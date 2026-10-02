import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "eve-concepto-propuesta-v2.html");
const pngPath = path.join(__dirname, "eve-concepto-propuesta-v2.png");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 2,
});

await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
  waitUntil: "networkidle",
});

await page.waitForTimeout(1500);

await page.screenshot({
  path: pngPath,
  fullPage: false,
  type: "png",
});

await browser.close();
console.log(`PNG exported: ${pngPath}`);
