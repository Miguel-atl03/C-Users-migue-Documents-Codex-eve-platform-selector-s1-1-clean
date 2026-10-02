# Dictamen — Ajuste final de coherencia visual Unidad 2 (local)

Fecha: 2026-07-15  
Alcance: coherencia visual con Amber activa. Sin staging/producción. Sin Unidad 3. Sin poblar KPIs/eje X/rail Y.

## Causa exacta de la pantalla en error

Había tres desajustes acumulados entre datos ya recuperados y la UI:

1. **Mensaje de sesión = mensaje de contexto.** `SESSION_UNAVAILABLE_ERROR` y `ACCESS_CONTEXT_ERROR` compartían el texto “No fue posible abrir el contexto solicitado.”, así que una sesión ausente o un fallo de bootstrap local se leía como contexto inválido aunque el repositorio y el BFF ya tuvieran Amber.
2. **Banda/workspace no diferenciaban `errorKind`.** El copy de error siempre usaba el título de contexto inaccesible; cabecera, banda y workspace podían contradecir el estado real.
3. **Con estado `active`, la banda mostraba “Contexto activo” en el chip Caso** en lugar del nombre del caso INC16, debilitando la lectura Empresa → Relación → Caso.

Los datos canónicos y el BFF ya estaban correctos; el problema era de presentación/transición visual, no de recovery.

## Transición de estado corregida

```
checking → (JWT real) authenticated
  → load companies
  → resolve URL canónica
  → active
```

| Estado | UI |
|---|---|
| sesión inválida | “No fue posible validar la sesión del Consultor.” + selectores ocultos |
| red | “No fue posible cargar el contexto.” + selectores visibles + Reintentar |
| contexto inválido | “No fue posible abrir el contexto solicitado.” + selectores visibles |
| `active` (Amber) | selectores visibles; workspace “Contexto activo.”; banda con caso INC16 |

## Archivos corregidos

- `presentation/client-context-shell-copy.ts` — errorKind + caseLabel en banda
- `hooks/use-client-context.ts` — `errorKind` session/context/network
- `components/ClientContextSelector.tsx` — ocultar selectores solo en fallo de auth
- `components/CoreStatusBand.tsx` (+ workspace, eje, rail, drawer) — copy sincronizado
- `components/OfficialControlPanelShell.tsx` — propagación caseLabel/errorKind
- pruebas e2e/regresión unit2b

## Resultados

| Chequeo | Resultado |
|---|---|
| Recovery / BFF Amber | pass |
| Verificador 2A | pass (`orphanCases: 0`, crosses 0) |
| Playwright unit2b | **10/10** |
| Regresión unit2b | **9/9** |
| Amber activa | Cervecería Amber + relación + caso INC16 |
| Estado actual | No disponible |
| Mensajes de error con Amber activa | ausentes |
| KPIs / eje X / rail Y | inactivos |
| Staging / producción / Unidad 3 | sin cambios |

## Captura final

`reports/local/amber-recovery/screenshots/08-amber-panel-final.png`

Muestra Amber seleccionada, relación y caso INC16, “Contexto activo.”, sin mensajes de error, KPIs en —, eje/rail sin datos operativos.
