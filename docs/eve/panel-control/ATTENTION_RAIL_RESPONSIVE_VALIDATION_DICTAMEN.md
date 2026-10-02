# RAIL DE ATENCIÓN Y GOBERNANZA VALIDADO EN DESKTOP, TABLET Y MOBILE

## CAPTURA 04 INCLUIDA EN EL BUNDLE

### Resultado obligatorio

| Criterio | Resultado |
|----------|-----------|
| desktop horizontal | PASS |
| tablet horizontal | PASS |
| mobile horizontal | PASS |
| overflow | 0 |
| drawer/foco | PASS |

### Viewports validados

- Desktop: 1440 × 1000
- Tablet: 1024 × 1366
- Mobile: 390 × 844

En cada viewport:

- `writing-mode = horizontal-tb` (parity Hitos Core)
- etiqueta y botón visibles
- botón habilitado
- `aria-label = "Abrir panel contextual"`
- `aria-expanded = false` (colapsado)
- sin overflow interno del rail
- botón/etiquetas dentro del rail y del viewport
- clic abre drawer (`aria-expanded=true`, estado `expanded`)
- Escape cierra, `aria-expanded=false`, foco regresa al botón

### Captura 04

- Ruta: `reports/local/experience-governance-correction/screenshots/04-rail-atencion-gobernanza-corregido.png`

### Evidencia JSON

`reports/local/experience-governance-correction/rail-responsive-e2e-result.json`
