# Dictamen: restauración UI rail Atención (horizontal)

## Veredicto

**APTO** — Rail colapsado de Atención y Gobernanza restablecido a `writing-mode: horizontal-tb`, en parity visual con Hitos Core.

## Qué se corrigió

El rail derecho colapsado había quedado con texto vertical (`vertical-rl` + `rotate(180deg)`). Se eliminó `.contextDrawerVerticalText` y se volvió al patrón de `.railYTitle` horizontal + botón de apertura horizontal a ancho del rail.

## Fuera de alcance

- Sin cambios de dominio, capabilities, RLS ni R4
- Drawer expandido / vacío factual sin cambios de lógica
- Login Suspense (`page.tsx`) no tocado en esta corrección

## Evidencia

- Unit `official-control-panel-attention-rail.test.mjs`: 5/5 PASS
- E2E `rail colapsado horizontal como Hitos Core (1440/1024/390)`: PASS
- `rail-responsive-e2e-result.json`: desktop/tablet/mobile `horizontal-tb` PASS
- Captura: `reports/local/experience-governance-correction/screenshots/04-rail-atencion-gobernanza-corregido.png`
- Causa del fallo visual previo: `next start` en `:3000` servía CSS de build antiguo con `vertical-rl`. Tras `npm run build` + restart, el rail queda horizontal.

## Archivos

Ver bundle `ui_rail_atencion_horizontal_restaurado_bundle.zip`.
