import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "estado-a-cipher-mockup.html");
const pngPath = path.join(__dirname, "estado-a-cipher-mockup.png");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
  waitUntil: "networkidle",
});

await page.waitForTimeout(1200);

const height = await page.evaluate(() => {
  const el = document.querySelector(".screen");
  return el ? Math.ceil(el.getBoundingClientRect().height) : document.body.scrollHeight;
});

await page.setViewportSize({ width: 1440, height: Math.max(height, 900) });
await page.waitForTimeout(300);

await page.screenshot({
  path: pngPath,
  fullPage: true,
  type: "png",
});

await browser.close();
console.log(`PNG exported: ${pngPath}`);
