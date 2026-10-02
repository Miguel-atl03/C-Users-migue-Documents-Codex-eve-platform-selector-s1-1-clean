/**
 * Genera informe .docx (OpenXML mínimo) sobre uso de archivos rectores.
 * Sin dependencias npm externas: arma carpeta OOXML + Compress-Archive.
 */
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  unlinkSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function p(text, opts = {}) {
  const bold = opts.bold
    ? `<w:b/>`
    : "";
  const size = opts.size ? `<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>` : `<w:sz w:val="22"/><w:szCs w:val="22"/>`;
  const color = opts.color ? `<w:color w:val="${opts.color}"/>` : "";
  const spacingAfter = opts.after ?? 160;
  const align = opts.align ? `<w:jc w:val="${opts.align}"/>` : "";
  return `<w:p>
  <w:pPr><w:spacing w:after="${spacingAfter}"/>${align}</w:pPr>
  <w:r><w:rPr>${bold}${size}${color}<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
  <w:t xml:space="preserve">${esc(text)}</w:t></w:r>
</w:p>`;
}

function h1(text) {
  return p(text, { bold: true, size: 32, after: 240 });
}
function h2(text) {
  return p(text, { bold: true, size: 26, after: 200 });
}
function h3(text) {
  return p(text, { bold: true, size: 24, after: 160 });
}
function body(text) {
  return p(text, { size: 22, after: 160 });
}
function bullet(text) {
  return `<w:p>
  <w:pPr>
    <w:spacing w:after="80"/>
    <w:ind w:left="360"/>
  </w:pPr>
  <w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
  <w:t xml:space="preserve">• ${esc(text)}</w:t></w:r>
</w:p>`;
}

const paragraphs = [
  h1("Informe: uso de archivos rectores en la implementación del Panel de Control EVE"),
  body(`Fecha: ${new Date().toISOString().slice(0, 10)}`),
  body("Alcance: explicar de qué manera, con qué causalidad, en qué secuencia y con qué objetivo sistémico se utilizan los archivos rectores del corpus del Panel oficial (y autoridades metodológicas asociadas) para ejecutar las instrucciones dadas al agente."),
  body("Este informe no redefine el corpus: describe el modo operativo real de consulta y prioridad."),

  h2("1. Objetivo sistémico"),
  body("El objetivo sistémico no es “llenar pantallas” ni improvisar reglas de producto. Es reconstruir, con trazabilidad auditable, el trabajo operativo real de la empresa cliente y proyectarlo en el Panel de Control oficial de modo que:"),
  bullet("la captura preserve la semántica del instrumento de recolección;"),
  bullet("la interpretación respete MMABP / VSM / AHE y el diseño cibernético de la plataforma;"),
  bullet("las decisiones de panel (selección, brechas, bloqueos, finales alternativos, atención) sean reproducibles desde datos persistidos (sesión / caso), no desde estado volátil de UI;"),
  bullet("toda proyección visible al consultor sea factual: si no hay evidencia, se muestra ausencia; nunca se inventa cierre."),
  body("En una frase: los rectores existen para que el agente implemente EVE como sistema de captura diagnóstica estructurada, no como formulario genérico."),

  h2("2. Causalidad: por qué cada rector manda lo que manda"),
  body("La causalidad operativa es de autoridad, no de conveniencia. Cada archivo causa un tipo de decisión distinto:"),

  h3("2.1 Diseño del Panel (autoridad funcional del Panel)"),
  body("Documento: Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx"),
  body("Causa: define qué debe verse, en qué jerarquía (empresa → relación → caso → usuario → perfil → sesión → actividad → run), qué estados son canónicos, qué criterios de aceptación (p. ej. §22 / FX-01…FX-12) y qué comportamientos están prohibidos (mocks de negocio, fusión de roles, inventar healthy/green, etc.)."),
  body("Efecto en el trabajo: si hay tensión entre una idea de implementación y este documento, este documento gana para UI, navegación, matrices X/Y, atención, gobernanza de experiencia y fixtures de aceptación del panel."),

  h3("2.2 Instrucciones Maestras MMABP / Diagnóstico EVE (marco operativo para IA)"),
  body("Documento: Instrucciones Maestras y Exhaustivas para IA — Arquitectura Mínima de Negocio (MMABP) y Diagnóstico EVE."),
  body("Causa: fija cómo debe razonar el agente sobre arquitectura mínima, diagnóstico y límites de intervención (qué puede inferir, qué debe persistir, qué no debe inventar)."),
  body("Efecto: condiciona el estilo de implementación (explicabilidad, no magia, separación captura vs inferencia, disciplina de cierre)."),

  h3("2.3 Fundamentals of Business Architecture Modeling (autoridad metodológica MMABP)"),
  body("Documento: Fundamentals of Business Architecture Modeling.pdf"),
  body("Causa: aporta el marco metodológico primario de modelado de arquitectura de negocio (objetos, estados, procesos, sincronización)."),
  body("Efecto: cuando hay que interpretar brechas MMABP (objeto/estado, handoff, sincronización), este libro es la causa metodológica; el Panel solo proyecta, no redefine MMABP."),

  h3("2.4 MMABP Minimal Business Architecture EVE + Capas estructurales 1.0 / 2.0–2.5 / AHE"),
  body("Documentos: MMABP_Minimal_Business_Architecture_EVE_v1_1_B3_B7_alineado.docx; Diseño estructural Plataforma EVE Capa 1.0; Capa 1.0 Producción Paralela; Capas 2.0–2.5; Capa 2.0–2.5 con AHE."),
  body("Causa: materializan la arquitectura cibernética de plataforma (motores, fronteras, producción paralela, tensiones AHE)."),
  body("Efecto: justifican por qué existen BFF/RPC, ledgers, procesos P-SUP, QA paralela y por qué el panel no calcula arquitectura “en React”."),

  h3("2.5 Política de selección primaria y catálogos Runtime 40/20 + Catálogo Madre"),
  body("Documentos: PrimaryActivitySelectionPolicy_EVE_MMABP_v1_3_Operacional.xlsx; Catalogo_Runtime_40_20…; EVE_Catalogo_Madre…"),
  body("Causa: definen reglas concretas de elegibilidad/selección (incl. máximo 8) y el catálogo de nodos base/causales (incl. blocked_by_missing_canonical_route)."),
  body("Efecto: FX-03/04/05/06 no se “diseñan” en la corrida: se implementan o proyectan reglas ya materializadas."),

  h3("2.6 PF-CORE-01 (BPMN)"),
  body("Documento: EVE_PF_CORE_01_Camunda_v0_3_0.bpmn"),
  body("Causa: autoriza el ciclo de vida del caso core (hitos H0–H6) y salidas alternativas (p. ej. ClosedWithoutSufficiency) como parte del OLC, no como error técnico."),
  body("Efecto: FX-12 proyecta un final ya autorizado; no crea un final nuevo."),

  h3("2.7 AGENTS.md / reglas de agente (traducción operativa local)"),
  body("Documento: AGENTS.md (y reglas de workspace derivadas)."),
  body("Causa: traduce el corpus a disciplina de implementación del repo (prioridad documental, tratamiento 1.2, soporte automático, consistencia antes de cierre, export, etc.)."),
  body("Efecto: es el puente entre rectores externos y commits/pruebas locales; no sustituye al Diseño del Panel."),

  h2("3. Secuencia de uso (orden causal de consulta)"),
  body("La secuencia no es lineal de lectura completa cada vez: es un embudo de autoridad. Orden obligatorio cuando hay decisión:"),
  body("Paso 1 — Identificar el tipo de decisión (UI/flujo panel, regla de selección, bloqueo runtime, hito core, experiencia, producción paralela, aceptación FX/CP)."),
  body("Paso 2 — Ir al Diseño del Panel (§ correspondiente) si la decisión es de superficie, criterios de aceptación, navegación o estados canónicos del panel."),
  body("Paso 3 — Si la decisión es de arquitectura de plataforma / frontera de motores, consultar Capas estructurales y MMABP Minimal."),
  body("Paso 4 — Si la decisión es de regla operativa concreta (selección ≤8, gap WorkMap, ruta B2, causal C05/C09), consultar Política de selección y Catálogos Runtime/Madre."),
  body("Paso 5 — Si la decisión es de ciclo de vida / final alternativo, consultar PF-CORE-01 + § del Diseño que proyecta Eje Y/KPI."),
  body("Paso 6 — Ejecutar en código solo la proyección/orquestación productiva (BFF → RPC → readback → UI), con fixture test-only para precondiciones y E2E para evidencia."),
  body("Paso 7 — Verificar contra criterios literales (baseline R4 / matriz CP-UX-SEC-A11Y) y dictaminar APTA o BLOQUEADO sin iniciar el siguiente tramo no autorizado."),

  h2("4. De qué manera se usan (modo de empleo)"),
  bullet("Como fuente de verdad, no como inspiración: se citan IDs/secciones/códigos canónicos; no se reescriben labels de negocio."),
  bullet("Como compuerta de alcance: si el rector no materializa una regla, no se inventa en la corrida (ej. FX-04 solo rechaza si la política de máximo 8 ya existe)."),
  bullet("Como cadena causal de implementación: evidencia Runtime/DB → servicio/BFF → View Model → Panel; React no decide arquitectura."),
  bullet("Como aislamiento de prueba: fixtures R4 usan empresas/casos propios; Amber no se puebla ni se usa como evidencia de promoción."),
  bullet("Como disciplina de evidencia: capturas y E2E demuestran precondición → acción oficial → estado final → negativo."),

  h2("5. Mapa causal resumido (entrada → decisión → salida)"),
  body("Diseño Panel §10/§11 → profundidad usuario/perfil/sesión y selección de actividades → POST BFF activity-selection / paneles de cobertura."),
  body("Política selección v1.3 → máximo 8 primarias → rechazo canónico selection_result_more_than_eight_primary."),
  body("workmap_coverage_gap (persistido) → atención/gobernanza → alerta factual workmap_coverage_gap."),
  body("Catálogo Runtime (C05 / transformation_exception_route_unresolved) → blocked_by_missing_canonical_route → readiness blocked + proyección en matrices."),
  body("PF-CORE-01 + Diseño §8 → ClosedWithoutSufficiency + motivo → Eje Y / rail de hitos (sin confundir con Cancelled)."),
  body("Diseño §22 criterios FX/CP/UX/SEC/A11Y → fixtures + verificador + dictamen APTA/BLOQUEADO."),

  h2("6. Qué no hacen estos archivos (límites)"),
  bullet("No autorizan rediseñar el instrumento de captura ni inventar estados “healthy/green” cosméticos."),
  bullet("No autorizan usar service_role como flujo de producto del consultor."),
  bullet("No autorizan mocks page.route().fulfill para auth/capacidades/negocio en E2E de aceptación."),
  bullet("No autorizan iniciar R5 ni mutar Amber cuando el tramo vigente es R4."),
  bullet("El resto del corpus no sustituye al Diseño del Panel en materia visual/funcional del panel."),

  h2("7. Conclusión"),
  body("Los archivos rectores se usan como sistema de causas encadenadas: metodología (MMABP) → arquitectura de plataforma (capas) → reglas operativas (política/catálogos/BPMN) → autoridad funcional de panel (Diseño v1.0) → traducción local (AGENTS.md) → implementación auditable (BFF/RPC/UI/fixtures)."),
  body("El objetivo sistémico de esa cadena es un Panel oficial que solo proyecta verdad operacional persistida, con criterios de aceptación reproducibles y sin inventar cierre."),
  body("Inventario físico de copia: ver el bundle archivos_rectores_panel_control_corpus_bundle.zip en Descargas y docs/eve/panel-control/corpus/CORPUS_MANIFEST.md."),
];

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
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
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:dcmitype="http://purl.org/dc/dcmitype/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Informe uso de archivos rectores — Panel de Control EVE</dc:title>
  <dc:creator>EVE Agent / Cursor</dc:creator>
  <cp:lastModifiedBy>EVE Agent / Cursor</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;

const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
  xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>EVE Platform Agent</Application>
</Properties>`;

const staging = join(process.env.TEMP || "/tmp", "informe_rectores_docx_staging");
const dest = join(
  process.env.USERPROFILE || process.env.HOME || process.cwd(),
  "Downloads",
  "Informe_Uso_Archivos_Rectores_Panel_Control_EVE.docx",
);

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

// Compress-Archive produces a zip; rename/ensure .docx
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

const st = statSync(dest);
console.log(
  JSON.stringify(
    {
      docx: dest,
      name: "Informe_Uso_Archivos_Rectores_Panel_Control_EVE.docx",
      bytes: st.size,
    },
    null,
    2,
  ),
);
