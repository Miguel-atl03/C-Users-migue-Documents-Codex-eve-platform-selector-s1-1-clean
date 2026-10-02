# Shell EVE B0 → B0.5 → B1 → B2 · puntos de conexión a runtime

Estado: **shell visual** (sin runtime conectado). Host único: `http://localhost:3112`.
`http://localhost:4173/eve-b2-la-pieza-v1` queda como **referencia de diseño congelada**.

## Rutas

| Ruta | Qué muestra |
| --- | --- |
| `/dev/ui-posicion-workmap?fresh=1` | Hoja continua completa: Posición → WorkMap → Umbral → B0 Memoria → B0 Cómo ocurre (+ frecuencia, inicio/cierre) → B0.5 → B1 → B2 (La pieza) |
| `/dev/ui-b2-pieza` | QA aislado de B2 La pieza. `?fixture=objeto\|sujeto\|accion\|relations\|exception\|clarification\|causal`, `?gate=0`, `?codes=0` |
| `/dev/ui-b2` | B2 Instrumento anterior (sin cambios, se conserva como referencia) |
| `/dev/ui-posicion-workmap-shell?fresh=1` | Copia de la hoja: Posición → WorkMap → Umbral → **Shell general de 4173** (`eve-shell-bloques-v1?band=actividad`) montado sin cambios en un `iframe` del alto de su contenido (un solo scroll: el del lienzo) |

## Variante `ui-posicion-workmap-shell`

- Fuente del shell: `deliverables/design/eve-shell-bloques-v1.html`, copiado byte a byte a
  `public/eve-shell/eve-shell-bloques-v1.html` (servido en `/eve-shell/eve-shell-bloques-v1.html`).
  Si se actualiza el HTML de diseño, hay que volver a copiarlo.
- Un solo scroll (`EveShellFrame.tsx`): al cargar, los `vh`/`svh` del CSS del shell se reescriben en memoria
  a `calc(var(--eve-host-vh) * n)` con la altura de pantalla del lienzo, el `iframe` toma la altura de su
  contenido y `window.scrollTo` del shell se redirige al scroll del lienzo. El archivo en disco no cambia.
  Efecto: los avisos `fixed` del shell (BUILD arriba, Reiniciar / avisos abajo) quedan en los bordes del
  bloque del shell, no fijos a la pantalla.
- Se monta al pulsar "Continuar hacia la memoria operativa" en el Umbral (`LocalSceneEntrySection.onComplete`).
- Las secciones posteriores al Umbral (B0 Memoria, Cómo ocurre, B0.5, B1, B2 en React) **no** se montan en esta ruta;
  la ruta original `/dev/ui-posicion-workmap` queda intacta.
- La memoria operativa que muestra el shell es su fixture interno (igual que en 4173). Punto de conexión
  disponible y no usado todavía: el shell acepta `?memory=<literal>` para recibir `sceneEntryViewModel.memoryLiteral`.
- El shell persiste solo en `localStorage` (`eve-shell-b0-v1`, `eve-shell-b05-v1`, `eve-shell-b1-v1`, `eve-shell-b2-v1`);
  no hay comunicación parent ↔ iframe ni Supabase.

## Cadena de desbloqueo en la hoja (presentación, no secuenciador)

| Evento | Prop / handler | Desbloquea |
| --- | --- | --- |
| Cierre de B0-Q04 (0.6 / 0.7 / 0.B) | `LocalB0ComoOcurreSection.onBoundariesConfirm(payload: B0BoundariesConfirmPayload)` | `official-b05` |
| Continuar B0.5 | `LocalCanvasB05Section.onContinue` | `official-b1` |
| Seguir B1 | `LocalCanvasB1InstrumentSection.onContinue` | `official-b2` |
| Guardar Bloque 2 | `LocalCanvasB2PiezaSection.onContinue` | (fin del shell; nota local) |

Todos los bloques reciben la actividad anclada desde `sceneEntryViewModel`:
`{ area: areaLabel ?? "", activityLiteral: memoryLiteral, heading: "Memoria operativa" }`.
Si no hay `areaLabel` se pasa vacío (no se usa el área por defecto del stub).

## Contrato de presentación (igual para B0.5, B1, B2)

`viewModel` (slots) + `answers` + `onChange(fieldKey, patch)` + `onContinue` + `continueDisabled` + `note` + `disabled`.
El runtime decide qué slots existen; las secciones **no ramifican**. En B2 La pieza, los tramos
(foco, antes, haces, queda, magnitud, sombra, limita) son paginación visual de los slots presentes.

## Punto de conexión por bloque

| Bloque | Hoy (stub) | Runtime a conectar | Notas |
| --- | --- | --- | --- |
| B0 | Secciones B0 propias (memoria, cómo ocurre, frecuencia, inicio/cierre) | `classify_scale` con binding R7 | La escala requiere LLM; no hay fallback estático. |
| B0.5 | `createB05VisualStubViewModel` (0.5.1, 0.5.1a, 0.5.1_rel, 0.5.1c, 0.5.1d, 0.5.2, 0.5.3, 0.5.4) | `open_interaction` / `submit` | Adaptador existente: `mapRuntimePresentationToB05`, `b05AnswerToRuntimeValue`. Único bloque con microcontrol de base de conocimiento visible (CAPTURED_MICROCONTROL en 0.5.1, 0.5.1a, 0.5.2, 0.5.3). |
| B1 | `createB1VisualStubViewModel` (1.1, 1.5, 1.2, 1.3, 1.4, 1.6, 1.7) | `B1RuntimeSession.submit(case)` | Targets C03 (1.8, 1.A/B/C) llegan como slots adicionales. |
| B2 | `createB2VisualStubViewModel` (2.1, 2.3, 2.4a, 2.4b, 2.5, 2.6, 2.7, 2.9, 2.11) | `CaptureRuntime`: `start_run`, `interaction_contract`, `submit_response`, `request_ai`, `review` | Ver riesgos abajo. |

## Mapeo de slots B2 → tramos de La pieza

| Tramo | source_code | Isla |
| --- | --- | --- |
| foco | 2.1 · 2.1a / 2.1b / 2.1c | up-l-44 · down-l-44 |
| antes | 2.5 | down-l-34 (se inscribe en la cota: «Antes») |
| haces | 2.4a, 2.4b | down-c2-34 (cota: «Lo que haces» = etiqueta de 2.4a) |
| queda | 2.6, 2.2_obj / 2.2_suj / 2.2_acc | down-r-34 (cota: «Cómo queda») |
| magnitud | 2.3 (escala en la cota), 2.7, 2.8 | top-l-40 · far-l-40 · far-r-34 |
| sombra | 2.9, 2.10, 2.B · 2.11, 2.12, 2.C | down-l-40 · down-r-40 (cota discontinua) |
| limita | 2.1_*_Relacion, 2.A · 2.1_ABC_Prioridad | down-l-40 · down-r-34 |
| otros | cualquier código no previsto | down-l-44 |

Textos, ayudas y opciones salen de los slots (Madre B2 Capa1 v2.1, `b2-madre-copy.ts`),
no del copy exploratorio de la maqueta (B2-UX-EVID-001 sigue en HOLD).

## Supuestos

- «El caso» (título del plano) = respuestas de 2.1a/b/c; si no existen, etiquetas de 2.1. Se oculta si no hay respuesta.
- Placeholders `{OBJETO}` / `{SUJETO}` / `{ACCIÓN}` en 2.2_* se sustituyen en pantalla por la respuesta de 2.1a/b/c; si falta, por la palabra genérica en minúscula. Con runtime, el texto resuelto debe llegar del servidor.
- Gate de ayuda («Abre + antes de responder») activo por defecto y solo en slots con `help_text`.
- Aclaraciones (`clarification`) presentes en un tramo bloquean «Continuar» hasta responderse.
- Ranking (2.1_ABC_Prioridad): orden por clic; completo cuando todas las opciones están ordenadas.

## Campos no mapeados / riesgos

- **2.2_\* opciones**: catálogo stub; en runtime son dinámicas (no promovidas, texto literal permitido).
- **C04 / K2**: sin fallback estático; requiere render IA + Human Gate (`EVAL-B2-MVP-STUB-v0.1`).
- **knowledge_basis**: solo B0.5 lo captura visiblemente; B0, B1 y B2 no lo preguntan (directly_observed, known_by_role, estimated, unknown_unconfirmed).
- **Trinchera** (lead / aterrizaje / ejemplo) de 2.A/B/C: el contrato `B2SlotPresentation` no tiene campos para ese copy; hoy se muestra solo la pregunta.
- **Persistencia**: respuestas B0.5/B1/B2 viven en estado local de la página dev; nada se escribe en Supabase todavía.
- La cabecera fija `LocalBlockShellChrome` cambia su etiqueta según el bloque visible y se oculta en B2 (La pieza trae su propia navegación).
