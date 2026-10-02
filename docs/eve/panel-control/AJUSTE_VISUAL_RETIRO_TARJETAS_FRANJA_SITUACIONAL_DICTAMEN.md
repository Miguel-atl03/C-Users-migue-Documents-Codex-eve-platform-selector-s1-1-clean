# Dictamen — Ajuste visual panel: retiro de tarjetas + franja situacional

Fecha: 2026-07-16  
Alcance: solo UI local del Panel de Control EVE  
Punto 8 / staging / producción: sin cambios

## Veredicto

Eliminadas las piezas marcadas en rojo y reubicados los campos situacionales restantes en la franja KPI **sin cambiar fuentes de datos**.

## Retirado de la UI

- Participación (cabecera)
- Usuarios, Roles funcionales, Actividades primarias, Procesos manuales, Findings / rework (franja)
- Resumen auxiliar del caso (banda + línea auxiliar)
- Tarjeta Todos (Eje X)

## Franja KPI resultante (5 celdas)

| Celda | Fuente | Notas |
|-------|--------|--------|
| Estado actual | `presentClientContext` ← `selectedCase.statusLabel` | Misma fuente que antes en cabecera |
| Próximo paso | `presentClientContext` (placeholder conservador) | Misma fuente |
| Atención requerida | `presentClientContext` (placeholder conservador) | Misma fuente |
| Hitos core alcanzados | shell `—` | Sin cálculo nuevo |
| Alertas de experiencia | shell `—` | Sin cálculo nuevo |

## ¿Se reestructuró la funcionalidad operativa?

**No.** Solo presentación/layout. No hay BFF nuevo, ni contratos nuevos, ni motor de cálculo KPI.

Reservados para monitoreo profundo (constante): Usuarios, Roles, Actividades, Procesos manuales, Findings.

## Eje X

- Solo P-SUP-01…09
- `process` ausente al entrar; inválido se elimina (no normaliza a Todos)

## Validación

- Regresión §7 / unit1 / unit2b / unit3b: pass
- Playwright Amber §7: pass

## Bundle

| | |
|---|---|
| Ruta | `C:\Users\migue\Downloads\ajuste_visual_retiro_tarjetas_franja_situacional_bundle.zip` |
| Archivo | `ajuste_visual_retiro_tarjetas_franja_situacional_bundle.zip` |
| Archivos | **23** |
