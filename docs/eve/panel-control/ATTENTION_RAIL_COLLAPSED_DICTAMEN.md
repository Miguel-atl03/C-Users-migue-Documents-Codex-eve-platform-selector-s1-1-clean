# RAIL COLAPSADO DE ATENCIÓN Y GOBERNANZA — RESTAURACIÓN HORIZONTAL

## Alcance

Restauración del estado colapsado de `AttentionGovernancePanel` al patrón horizontal de Hitos Core (`.railYTitle`), eliminando `writing-mode: vertical-rl`.

Sin cambios en contenido del drawer, estado §17 ni lógica de apertura/cierre.

## Resultado

En el rail colapsado:

- **Atención y Gobernanza** usa `.railYTitle` con `writing-mode: horizontal-tb`
- **Abrir panel contextual** también horizontal, ancho completo del rail
- Sin `.contextDrawerVerticalText`, sin `rotate(180deg)`, sin `<br>`

## Accesibilidad

- `aria-label="Abrir panel contextual"` en el botón colapsado
- `aria-expanded="false"` conservado
- Texto visual en `<span aria-hidden="true">`
- Escape cierra el drawer y el foco regresa al botón de apertura

## Validación

| Prueba | Resultado |
|--------|-----------|
| `official-control-panel-attention-rail.test.mjs` | horizontal-tb |
| E2E rail + captura `04-rail-atencion-gobernanza-corregido.png` | horizontal |

## Archivos

- `src/features/official-consultant-control-panel/components/AttentionGovernancePanel.tsx`
- `src/features/official-consultant-control-panel/styles/official-control-panel.module.css`
- `tests/regression/consultant-control-panel/official-control-panel-attention-rail.test.mjs`
- `tests/e2e/official-consultant-control-panel-experience-governance-correction.spec.ts`
