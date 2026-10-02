# Implementación — §7 Eje X: Procesos de soporte

Fecha: 2026-07-16 (cierre de correcciones MECE)  
Autoridad: `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` §4.4 / §7 / §7.1  
Documento excluido: `Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx`

## Extracción canónica (§7)

| Elemento UI | Orden visual | sequence catálogo | Modalidad UI |
|-------------|--------------|-------------------|--------------|
| Todos | 0 | 0 (agregado, no P-SUP) | Vista global |
| P-SUP-01 | 1 | 1 | PLATAFORMA |
| P-SUP-02 | 2 | 2 | PLATAFORMA |
| P-SUP-03 | 3 | 3 | MANUAL |
| P-SUP-04 | 4 | 4 | MANUAL |
| P-SUP-05 | 5 | 5 | MANUAL |
| P-SUP-06 | 6 | 6 | PLATAFORMA |
| P-SUP-07/08 | 7 | 7 | PLATAFORMA (agrupado) |
| P-SUP-09 | 8 | **8** | PLATAFORMA |

`sequence` del catálogo ≠ índice de array a ciegas: Todos es entrada agregada; P-SUP-09 tiene `sequence: 8`.

Target Object[State], trigger, siguiente evento y dependencia: según tabla §7; campos no definidos por el rector → UI “No disponible”.

## Correcciones de cierre aplicadas

### A — Cliente Supabase global
- Revertido el `lock` no-op en `src/lib/supabase.ts`.
- Estabilidad local: `local-session-bootstrap.ts` (JWT en localStorage + timeouts), sin alterar el cliente global.

### B — Gate de contexto autorizado
- El Eje X solo carga con `authReadiness=authenticated` ∧ `status=active` ∧ company/relationship/case validados.
- Un `case` en URL **no** basta.
- AbortController + `requestIdRef` evitan respuestas obsoletas.

### C — Navegación
- Solo `router.push` / `router.replace`.
- Selección manual → push; inválidos → replace a `Todos` (solo con contexto activo).
- Independiente de `milestone`.
- Cambio empresa/relación/caso limpia `process` (vía `client-context-navigation`).

### D — Contenedor
- Track: `overflow-x: auto; overflow-y: hidden`.
- Inner: `flex` + `nowrap` + `width: max-content`.
- Chips altura fija 44px, sin wrap vertical.

### E/F/G — Copy y catálogo
- Todos: badge “Vista global” (no “Plataforma / manual”).
- Banda: “Resumen auxiliar del caso”.
- Rail: “Hitos auxiliares del caso” (sin copy técnico Eje Y en UI).

### H — Accesibilidad
- Patrón `toolbar` + `button` + `aria-pressed`.
- Flechas (foco), Home/End (selección), Enter/Space.
- Anuncio accesible con modalidad y estado.

## Arquitectura entregada

- Catálogo: `support-process-axis.catalog.ts`
- BFF: `GET .../cases/:caseId/support-processes`
- Hook: `use-case-support-processes.ts`
- UI: `SupportProcessAxis*`, workspace summary
- Estado operacional: degradado (`partial` / `unavailable`) — sin inventar Amber

## Estados

`idle` | `loading` | `ready` | `partial` | `error`

Idle cuando no hay contexto autorizado. Loading solo tras autorización.
