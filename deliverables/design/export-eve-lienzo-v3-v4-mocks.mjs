import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const jobs = [
  {
    html: "eve-lienzo-banda-horizontal-v3-mock.html",
    png: "eve-lienzo-banda-horizontal-v3-mock.png",
  },
  {
    html: "eve-lienzo-cuadrantes-v4-mock.html",
    png: "eve-lienzo-cuadrantes-v4-mock.png",
  },
];

const browser = await chromium.launch();

for (const job of jobs) {
  const htmlPath = path.join(__dirname, job.html);
  const pngPath = path.join(__dirname, job.png);
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
    clip: { x: 0, y: 0, width: 1440, height: 1100 },
  });

  await page.close();
  console.log(`PNG exported: ${pngPath}`);
}

await browser.close();
