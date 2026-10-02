import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const W = 1200;
const H = 3200;
const root = process.cwd();
const out = path.join(root, "docs/eve/visual/workmap-contemplation-rooms-proposal.png");
const hero = path.join(root, "public/eve-hero-architecture-bw.jpg");

fs.mkdirSync(path.dirname(out), { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="${W / 2}" y="420" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="6" fill="#7a8190">[ MAPA DE TU TRABAJO ]</text>
  <text x="${W / 2}" y="680" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="600" fill="#12141a">¿Dónde participa tu trabajo?</text>
  <text x="${W / 2}" y="780" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#7a8190">Operaciones / Producción</text>
  <text x="${W / 2}" y="830" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#7a8190">Ventas / Comercial</text>
  <text x="${W / 2}" y="880" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#7a8190">Finanzas y Tesorería</text>
  <text x="${W / 2}" y="930" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#7a8190">…</text>
  <line x1="420" y1="1180" x2="780" y2="1180" stroke="#d8dce2" stroke-width="1"/>
  <text x="${W / 2}" y="1380" text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="600" fill="#12141a">De qué respondes en Operaciones / Producción</text>
  <line x1="300" y1="1520" x2="900" y2="1520" stroke="#d8dce2" stroke-width="1"/>
  <text x="${W / 2}" y="1820" text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="600" fill="#12141a">Qué haces para cumplirlo</text>
  <line x1="300" y1="1940" x2="900" y2="1940" stroke="#d8dce2" stroke-width="1"/>
  <line x1="300" y1="2060" x2="900" y2="2060" stroke="#d8dce2" stroke-width="1"/>
  <text x="${W / 2}" y="2980" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#12141a">Guardar</text>
  <line x1="${W / 2 - 36}" y1="2988" x2="${W / 2 + 36}" y2="2988" stroke="#12141a" stroke-width="1"/>
</svg>`;

const bandH = 360;
const heroBuf = await sharp(hero).resize(W, bandH, { fit: "cover", position: "centre" }).toBuffer();

await sharp({
  create: { width: W, height: H, channels: 3, background: "#fafbfc" },
})
  .composite([
    { input: heroBuf, top: 0, left: 0 },
    { input: Buffer.from(svg), top: 0, left: 0 },
  ])
  .png()
  .toFile(out);

console.log(`Wrote ${out} (${fs.statSync(out).size} bytes)`);
