# Dictamen — Rollback de simplificación visual del Panel de Control EVE

Fecha: 2026-07-16  
Checkpoint restaurado: `C:\Users\migue\Downloads\rector_point_7_support_process_axis_bundle.zip`

## Veredicto

**Rollback de simplificación completado.**  
**Estado restaurado al checkpoint aprobado del §7.**  
**Cero cambios adicionales** (sin reinterpretar diseño, sin retirar tarjetas, sin reubicar componentes, sin mejoras, sin migraciones/datos/staging/prod).

## Estado visual recuperado

- Franja original de **siete KPI**
- Tarjeta **Todos**
- **Resumen auxiliar del caso** (banda + eje auxiliar)
- Eje X en ubicación global original (bajo el resumen auxiliar, sobre la matriz)
- Detalle del proceso seleccionado / vista global en su ubicación anterior
- Rail, workspace y Atención y gobernanza sin cambios de alcance

## Fuente de restauración

1. Archivos del bundle `rector_point_7_support_process_axis_bundle.zip`
2. `OfficialControlPanelShell.tsx` reconstruido al layout del checkpoint (banda + eje auxiliar + SupportProcessAxis + summary + matriz)
3. `support-process-navigation.ts` del checkpoint (`process=Todos`, normalización a Todos)
4. Pruebas unitarias alineadas a etiquetas del checkpoint (`Resumen auxiliar`, `Hitos auxiliares`)

## Validación

- Regresión §7: pass
- unit1 / unit2b / unit3b / R2 blocked: pass
- Captura Amber regenerada tras rollback

## Fronteras

- Punto 8: no iniciado
- Staging/producción: sin cambios
