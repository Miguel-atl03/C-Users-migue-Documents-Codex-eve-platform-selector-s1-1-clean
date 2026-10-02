# Dictamen — Unidad 3B

Fecha: 2026-07-15  
Alcance: activación visual Proceso principal + Hitos del caso sobre BFF Unidad 3A  
**Unidad 4: no iniciada.** Staging/producción: sin cambios.

## Veredicto

**Unidad 3B aceptada en local.** La UI del Panel de Control EVE consume el BFF real de estructura de proceso, diferencia vacío factual / parcial / activo / error, y muestra Amber sin proceso ni hitos como ausencia honesta (no error).

## Endpoint reutilizado

`GET /api/eve/official-consultant-control-panel/cases/:caseId/process-structure`  
(Unidad 3A; contrato ampliado solo con `status` además de `statusLabel` para presentación).

## Componentes creados / adaptados

| Pieza | Rol |
|-------|-----|
| `use-case-process-structure.ts` | Carga BFF, estados, selección local+URL |
| `process-structure-presentation.ts` | idle/loading/empty/partial/active/error; esperas; inconsistencias |
| `milestone-navigation.ts` | Query param `milestone` |
| `MainProcessBand.tsx` | Banda Proceso principal |
| `MainProcessAxis.tsx` | Eje / etiqueta de proceso |
| `CaseMilestonesRail.tsx` + item | Rail Hitos del caso |
| `CaseMilestoneDetail.tsx` | Workspace central (solo campos Unit 3B) |
| `ProcessStructureState.tsx` | Loading / error genérico |
| `OfficialControlPanelShell.tsx` | Cableado sin Unit 4 |

## Estados visuales

| Estado | Significado |
|--------|-------------|
| `idle` | Sin caso activo |
| `loading` | Carga en curso (`aria-live`) |
| `empty` | Sin proceso principal (Amber hoy) |
| `partial` | Proceso sin hitos, sin hito actual, espera incompleta o inconsistencia |
| `active` | Proceso + hitos válidos + hito actual explícito + sin espera incompleta fuerte |
| `error` | Fallo técnico / autorización (mensaje genérico) |

Vacío ≠ error.

## Regla de hito actual

Solo `mainProcess.currentMilestoneId` si pertenece al proceso.  
**No** se infiere por `status=current`, secuencia, fechas ni nombre.  
Si hay contradicción `currentMilestoneId` ↔ estado del hito → `partial` + alerta; sin corrección visual.

## Regla de espera completa / incompleta

Completa: evento esperado **y** límite temporal.  
Incompleta: falta uno de los dos → señal en rail y detalle.  
No se inventa el dato faltante.

## Navegación `milestone=<id>`

- Solo IDs del proceso del caso.
- Inválido → `router.replace` elimina el param.
- Refresh / back / forward respetan selección válida.
- Cambio de empresa/relación/caso limpia `milestone`.
- Mientras Unit 2 resuelve el caso, no se borra `milestone` de la URL prematuramente.
- Selección por click se conserva en estado local aunque la URL laggee.

## Comportamiento Amber (canónico)

| Campo | Valor factual |
|-------|----------------|
| Empresa | `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` |
| Relación | `7c499a1c-31c6-4fc9-8b20-2fd8cdc57043` |
| Caso | `19fc9eff-4219-43f0-854c-e2b3350f23f2` |
| Proceso | No disponible para este caso |
| Hitos | No hay una estructura de proceso disponible |

Sin seed de proceso/hitos. Sin datos inventados.

## Elementos que permanecen inactivos

KPIs `—`, Usuarios, Roles funcionales, Actividades, Procesos manuales, Findings, Alertas, Runtime 40+20, Gobernanza de Experiencia (modo deshabilitado).

## Pruebas

| Suite | Resultado |
|-------|-----------|
| `official-control-panel-unit3b.test.mjs` | pass (7) |
| Playwright `official-consultant-control-panel-unit3b.spec.ts` | pass (6) |
| Unit 3A regression | pass |
| Unit 2A / 2B regression | pass |
| Unit 1 regression (actualizada a shell 3B) | pass |
| legacy freeze | pass |
| `tsc --noEmit` | pass |

Estados `partial`/`active` se validan con fixtures mock en Playwright (no seed Amber).

## Capturas

`reports/local/unit3/screenshots/`

1. `01-amber-sin-proceso.png`
2. `02-proceso-sin-hitos.png`
3. `03-proceso-parcial.png`
4. `04-hito-actual.png`
5. `05-hito-en-espera-completa.png`
6. `06-hito-en-espera-incompleta.png`
7. `07-desktop.png`
8. `08-tablet.png`
9. `09-mobile.png`

## Defectos encontrados (resueltos)

1. Race: limpieza de `milestone` mientras Unit 2 aún no activaba el caso → borraba selección por URL.
2. Detalle no seguía clicks si la URL se desincronizaba → estado local de selección.
3. Regresiones Unit 1 / 2B esperaban placeholders Unit 1 → actualizadas a banda/rail 3B sin activar Unit 4.

## Riesgos pendientes

- Datos Amber de proceso siguen requiriendo evidencia/aprobación administrativa (fuera de 3B).
- PostgREST schema cache tras migraciones locales previas (3A).
- E2E de seguridad multi-consultor exhaustivo queda apoyado en BFF 3A + tests de acceso; la UI no concede acceso por query.

## Cero cambios remotos / alcance

- Solo validación local.
- Staging y producción sin deploy ni migraciones nuevas de 3B (UI only sobre 3A).
- **Unidad 4 no iniciada.**

## Archivos principales de esta unidad

- Feature UI proceso/hitos (hooks, presentation, state, components)
- `OfficialControlPanelShell.tsx` + CSS panel
- `client-context-api.ts` (`getCaseProcessStructure`)
- Contrato BFF types/service (`status` code)
- Tests regression Unit 1/2B/3B + Playwright 3B
- Docs dictamen 3B + capturas locales
