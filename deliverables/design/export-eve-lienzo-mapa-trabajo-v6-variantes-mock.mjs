import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const jobs = [
  {
    html: "eve-lienzo-mapa-trabajo-v6-mock.html",
    png: "eve-lienzo-mapa-trabajo-v6-mock.png",
  },
  {
    html: "eve-v6-secuencial-mock.html",
    png: "eve-v6-secuencial-mock.png",
  },
];

const browser = await chromium.launch();

for (const job of jobs) {
  const htmlPath = path.join(__dirname, job.html);
  const pngPath = path.join(__dirname, job.png);
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
  console.log(`PNG exported: ${pngPath}`);
}

await browser.close();
