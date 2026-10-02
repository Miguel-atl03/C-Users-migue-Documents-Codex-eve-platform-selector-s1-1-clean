import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const htmlPath = path.join(__dirname, "eve-lienzo-mapa-trabajo-v7-mock.html");
const pngPath = path.join(__dirname, "eve-lienzo-mapa-trabajo-v7-mock.png");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1200 },
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
  clip: { x: 0, y: 0, width: 1440, height: 1200 },
});

await page.close();
await browser.close();
console.log(`PNG exported: ${pngPath}`);
