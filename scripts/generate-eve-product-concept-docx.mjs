/**
 * Genera EVE_Concepto_Producto_Final_v1_0.docx (OpenXML mínimo).
 * Fuente canónica: docs/eve/visual/EVE_CONCEPTO_PRODUCTO_FINAL.md
 */
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  unlinkSync,
  statSync,
  copyFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function p(text, opts = {}) {
  const bold = opts.bold ? `<w:b/>` : "";
  const size = opts.size
    ? `<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`
    : `<w:sz w:val="22"/><w:szCs w:val="22"/>`;
  const color = opts.color ? `<w:color w:val="${opts.color}"/>` : "";
  const spacingAfter = opts.after ?? 160;
  const align = opts.align ? `<w:jc w:val="${opts.align}"/>` : "";
  const italic = opts.italic ? `<w:i/>` : "";
  return `<w:p>
  <w:pPr><w:spacing w:after="${spacingAfter}"/>${align}</w:pPr>
  <w:r><w:rPr>${bold}${italic}${size}${color}<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
  <w:t xml:space="preserve">${esc(text)}</w:t></w:r>
</w:p>`;
}

function h1(text) {
  return p(text, { bold: true, size: 36, after: 280 });
}
function h2(text) {
  return p(text, { bold: true, size: 28, after: 220 });
}
function h3(text) {
  return p(text, { bold: true, size: 24, after: 180 });
}
function body(text) {
  return p(text, { size: 22, after: 160 });
}
function quote(text) {
  return p(`“${text}”`, { italic: true, size: 24, after: 200, align: "center" });
}
function bullet(text) {
  return `<w:p>
  <w:pPr><w:spacing w:after="80"/><w:ind w:left="360"/></w:pPr>
  <w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
  <w:t xml:space="preserve">• ${esc(text)}</w:t></w:r>
</w:p>`;
}

const paragraphs = [
  h1("EVE — Concepto de producto final"),
  body("Versión 1.1 · 2026-08-26"),
  body("Guía canónica de diseño y producto para el lienzo oficial (eve-local-canvas)."),
  body("Enterprise Viability Engine — Strategic & Operational Architecture"),

  h2("1. Identidad en una frase"),
  body(
    "EVE es un instrumento de captura diagnóstica donde una persona reconstruye, con precisión auditable, cómo ocurre realmente su trabajo — para que consultores y motores downstream lean la arquitectura operativa de la empresa con trazabilidad.",
  ),
  quote("Lo que sostiene no siempre se ve. Una forma distinta de mirar."),

  h2("2. Qué es EVE (y qué no es)"),
  h3("EVE es"),
  bullet("Espacio de levantamiento estructural continuo (hoja de trabajo, no wizard)."),
  bullet("Instrumento de medición operativa con preguntas canónicas e inferencia asistida."),
  bullet("Sistema que preserva la semántica del instrumento y produce salidas auditables."),
  bullet("Experiencia donde el usuario testifica su operación real; la plataforma decide secuencia, soporte y aclaraciones."),
  bullet("Producto orientado a viabilidad empresarial: hacer visible lo que sostiene el negocio."),

  h3("EVE no es"),
  bullet("Formulario genérico, survey SaaS ni Typeform."),
  bullet("Dashboard de productividad, BI o KPIs."),
  bullet("Chat conversacional que disfraza un cuestionario."),
  bullet("Wizard gamificado con barras de progreso ruidosas."),
  bullet("Herramienta que expone brechas MMABP, VSM, actividades soporte o inferencias al participante."),

  h2("3. Promesa de producto"),
  quote("Hacer visible la arquitectura operativa de una empresa — empezando por el trabajo real de una persona."),
  body("Capas de la promesa:"),
  bullet("Captura fiel — trabajo real, no autoetiquetas abstractas."),
  bullet("Estructura legible — organización para diagnóstico sistémico."),
  bullet("Trazabilidad — todo lo inferido o aclarado puede explicarse; nada se inventa."),

  h2("4. Sensación que debe proyectar"),
  bullet("Calma estructural — sin prisa visual ni urgencia artificial."),
  bullet("Seriedad intelectual — respeto al oficio, no infantilización."),
  bullet("Acompañamiento preciso — no sensación de examen hostil."),
  bullet("Revelación gradual — estructura que emerge, no saltos dispares."),
  bullet("Competencia silenciosa — el sistema sabe qué pedir sin mostrar la maquinaria."),
  body("Tono emocional meta: claro, sobrio, confiable — como un estudio de arquitectura o una mesa de revisión técnica."),

  h2("5. Concepto de diseño: Hoja de trabajo monumental"),
  body(
    "Metáfora central: una hoja continua donde cada fase es una sala del mismo edificio, no una pantalla aislada. El usuario atraviesa salas que se revelan sobre la misma superficie de trabajo.",
  ),
  h3("Salas del recorrido"),
  bullet("Acceso — identidad y entrada."),
  bullet("Posición — lugar de participación y proximidad a decisiones."),
  bullet("Mapa de trabajo — responsabilidades y actividades reales."),
  bullet("Significado / B0 — significado operativo de la actividad."),
  bullet("Runtime B0.5–B7 — bloques Instrumento por escena."),
  bullet("Cierre — consistencia, aclaraciones, completitud."),

  h3("Patrón Instrumento"),
  body(
    "Cada bloque runtime es una pieza de medición: slots, opciones, help y aclaraciones con precisión tipográfica, sin cromatismo decorativo.",
  ),

  h3("Espacio sobre información"),
  body(
    "El vacío es protagonista compositivo (~75% plano abierto, ~25% contenido). Las preguntas y opciones viven como eventos dispersos sobre la superficie, no como bloques que llenan el centro.",
  ),
  body("Referencia compositiva: deliverables/design/eve-concepto-propuesta-v2.html"),

  h3("La línea delgada: opciones como inscripciones"),
  body(
    "En cuanto las opciones se presentan como listado vertical centrado, la hoja deja de ser plano monumental y se convierte en cuestionario. La clave no es ocultar opciones sino cambiar su estatus ontológico en pantalla.",
  ),
  bullet("Islas posicionadas en el void, no stacks verticales centrados."),
  bullet("Opciones en susurro (--eve-mist, ~11px) hasta activación por peso + tinta (--eve-ink)."),
  bullet("Sin radio, checkbox, pill, chip ni borde de selección."),
  bullet("La pregunta es el evento tipográfico; las opciones son consecuencia secundaria."),
  bullet("Muchas opciones: distribución espacial o bandas, no scroll de catálogo tipo survey."),
  bullet("Acciones como traza subrayada o bracketed (GUARDAR), no botón primario."),
  body("Aplicación: Posición = dos islas; Instrumento = slots sin listado vertical centrado."),

  h2("6. Principios de diseño (obligatorios)"),
  bullet("P1 Tipografía como arquitectura — preguntas como inscripciones, no labels."),
  bullet("P2 Monocromía con intención — sheet #fafbfc, ink #12141a, acento #5c7d8f; sin gradientes ni sombras."),
  bullet("P3 Una gramática visual para todo el recorrido."),
  bullet("P4 Contenedor sobrio, voz humana — lenguaje de trinchera en copy."),
  bullet("P5 Revelación, no wizard — sin “Paso 3 de 12”."),
  bullet("P6 Autoridad silenciosa del sistema."),
  bullet("P7 Instrumento antes que interfaz — alineado a Matriz, sin secuenciador local."),
  bullet("P8 Fidelidad metodológica — Madre → Matriz → lienzo → QA."),
  bullet("P9 Conservadurismo ante datos ausentes — nunca fabricar respuestas."),
  bullet("P10 Auditabilidad sobre pulido cosmético."),
  bullet("P11 Espacio sobre información; opciones como inscripciones — void dominante, selección por peso + tinta, composición por islas."),

  h2("7. Gramática visual"),
  body("Tokens: eve-sheet (fondo), eve-ink (texto), eve-mist (secundario), eve-line (divisores), eve-accent (acento puntual)."),
  body("Composición: ~75% void / ~25% contenido, islas conceptuales, acciones mínimas (GUARDAR, [ COMIENZA TU LEVANTAMIENTO ]), sin wall of cards."),
  body("Opciones inactivas: mist ~11px peso 400; activas: ink peso 600–700; sin contenedor visual."),

  h2("8. Tono y voz"),
  body("Voz de marca: declarativa, filosófica en vestíbulo, operativa en bloques, español claro."),
  h3("Micro-aclaraciones — estructura obligatoria"),
  bullet("Comentario de trinchera"),
  bullet("“A lo que me refiero es…”"),
  bullet("“Por ejemplo…” (contextualizado)"),
  bullet("Pregunta breve de aclaración"),
  body("Nunca exponer al usuario: MMABP, VSM, S3, slot_ref, InteractionViewModel, selección de actividad soporte."),

  h2("9. Roles en la experiencia"),
  bullet("Participante — describe trabajo real cuando el flujo lo solicita."),
  bullet("Plataforma — selecciona, infiere, detecta brechas, incorpora soporte, aclara, cierra."),
  bullet("Consultor — revisa salidas auditables desde datos persistidos."),

  h2("10. Anti-patrones (prohibidos)"),
  bullet("Dashboards BI, charts, KPIs, tarjetas decorativas."),
  bullet("Ilustraciones friendly, emojis, gamificación."),
  bullet("Exposición de lógica interna al participante."),
  bullet("Rediseño del instrumento por conveniencia visual."),
  bullet("Mockups descartados como referencia de implementación."),
  bullet("Listas verticales centradas de opciones (stack tipo menú de respuestas)."),
  bullet("Grids de opciones que llenan el centro sin void dominante."),
  bullet("Controles de formulario visibles: radio, checkbox, pill, chip, borde de selección."),
  bullet("Tipografía de lectura (≥14px) para opciones inactivas."),
  bullet("Scroll de catálogo de respuestas tipo survey."),

  h2("11. Checklist — pantalla nueva"),
  bullet("¿Calma estructural y seriedad intelectual?"),
  bullet("¿Gramática visual EVE?"),
  bullet("¿Copy conforme Madre + Matriz?"),
  bullet("¿Necesidad de información, no maquinaria interna?"),
  bullet("¿Continuidad con salas anteriores?"),
  bullet("¿Sin anti-patrones?"),
  bullet("¿Trazabilidad y proveniencia?"),
  bullet("¿Lista para binding Runtime sin secuenciador local?"),
  bullet("¿El void domina la composición (~75% plano abierto)?"),
  bullet("¿Las opciones se leen como inscripciones susurradas, no como listado de formulario?"),
  bullet("¿La selección se manifiesta solo con peso + tinta, sin cajas ni controles visibles?"),
  bullet("¿Preguntas y opciones en islas/bandas, no apiladas en columna central?"),

  h2("12. Implementación de referencia"),
  body("Lienzo: src/components/eve-local-canvas/LocalCanvasExperience.tsx"),
  body("Patrón Instrumento: LocalCanvasB05Section, B1–B5 InstrumentSection"),
  body("Composición monumental: deliverables/design/eve-concepto-propuesta-v2.html"),
  body("Estado A: LocalEstadoASection.tsx — pendiente alineación a islas + susurro"),
  body("Fuente markdown: docs/eve/visual/EVE_CONCEPTO_PRODUCTO_FINAL.md"),
  body("Productivo: localhost:3112 · Taller aislado: /dev/ui-b1 … /dev/ui-b5"),

  h2("13. Posicionamiento"),
  body(
    "EVE gana en estructura diagnóstica y trazabilidad frente a form builders; en profundidad operativa frente a surveys de RRHH; en captura vivida frente a process mining; en reconstrucción reproducible frente a entregables estáticos. No compite en velocidad de llenado ni UX divertida — compite en calidad arquitectónica del levantamiento.",
  ),

  h2("14. Uso del documento"),
  body(
    "Base para fabricación UI, integración al flujo productivo, revisiones de copy/tokens y criterio de rechazo de propuestas que rompan la gramática. Próxima revisión: integración del primer bloque Instrumento al flujo productivo completo.",
  ),

  p("— Documento canónico EVE · Concepto de producto final v1.1", {
    size: 20,
    after: 0,
    align: "center",
    color: "666666",
  }),
];

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("\n")}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>EVE — Concepto de producto final</dc:title>
  <dc:creator>EVE Platform</dc:creator>
  <dc:description>Guía canónica de diseño y producto para el lienzo oficial</dc:description>
  <cp:keywords>EVE, diseño, producto, lienzo, Instrumento</cp:keywords>
</cp:coreProperties>`;

const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Node.js EVE docx generator</Application>
</Properties>`;

const fileName = "EVE_Concepto_Producto_Final_v1_1.docx";
const downloadsDest = join(
  process.env.USERPROFILE || process.env.HOME || process.cwd(),
  "Downloads",
  fileName,
);
const repoDest = join(repoRoot, "docs", "eve", "visual", fileName);

function buildDocx(dest) {
  const staging = join(process.env.TEMP || "/tmp", "eve_concepto_producto_docx_staging");
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(join(staging, "_rels"), { recursive: true });
  mkdirSync(join(staging, "word", "_rels"), { recursive: true });
  mkdirSync(join(staging, "docProps"), { recursive: true });

  writeFileSync(join(staging, "[Content_Types].xml"), contentTypes, "utf8");
  writeFileSync(join(staging, "_rels", ".rels"), rels, "utf8");
  writeFileSync(join(staging, "word", "document.xml"), documentXml, "utf8");
  writeFileSync(join(staging, "word", "_rels", "document.xml.rels"), docRels, "utf8");
  writeFileSync(join(staging, "docProps", "core.xml"), core, "utf8");
  writeFileSync(join(staging, "docProps", "app.xml"), app, "utf8");

  if (existsSync(dest)) unlinkSync(dest);
  const zipTmp = dest.replace(/\.docx$/i, ".zip");
  if (existsSync(zipTmp)) unlinkSync(zipTmp);

  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${staging}\\*' -DestinationPath '${zipTmp}' -Force; Move-Item -LiteralPath '${zipTmp}' -Destination '${dest}' -Force`,
    ],
    { encoding: "utf8" },
  );
  if (ps.status !== 0) {
    console.error(ps.stdout || ps.stderr || "docx_compress_failed");
    process.exit(ps.status || 1);
  }
  return statSync(dest).size;
}

mkdirSync(dirname(repoDest), { recursive: true });
const downloadsBytes = buildDocx(downloadsDest);
copyFileSync(downloadsDest, repoDest);
const repoBytes = statSync(repoDest).size;

console.log(
  JSON.stringify(
    {
      downloads: downloadsDest,
      repo: repoDest,
      markdown: join(repoRoot, "docs", "eve", "visual", "EVE_CONCEPTO_PRODUCTO_FINAL.md"),
      bytes: { downloads: downloadsBytes, repo: repoBytes },
    },
    null,
    2,
  ),
);
