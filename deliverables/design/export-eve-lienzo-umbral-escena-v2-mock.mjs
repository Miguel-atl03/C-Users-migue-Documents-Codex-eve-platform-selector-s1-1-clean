import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "eve-lienzo-umbral-escena-v2-mock.html");
const frames = [
  { id: "1", name: "eve-lienzo-umbral-escena-v2-beat1.png" },
  { id: "2", name: "eve-lienzo-umbral-escena-v2-beat2.png" },
  { id: "3", name: "eve-lienzo-umbral-escena-v2-beat3.png" },
  { id: "4", name: "eve-lienzo-umbral-escena-v2.png" },
];

const browser = await chromium.launch();

for (const frame of frames) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 2,
  });

  await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle",
  });

  await page.evaluate((frameId) => {
    document.body.dataset.frame = frameId;
  }, frame.id);

  await page.waitForTimeout(400);

  const pngPath = path.join(__dirname, frame.name);
  await page.screenshot({
    path: pngPath,
    fullPage: false,
    type: "png",
  });

  await page.close();
  console.log(`PNG exported: ${pngPath}`);
}

await browser.close();
