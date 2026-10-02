# Rector Point 17 — State & Alert Aggregation Implementation

## Vocabularios separados
Business Object[State] ≠ Experience screen status ≠ Attention severity.

## Jerarquía Empresa Cliente
1 Cerrado → 2 Bloqueado → 3 Atención → 4 En curso → 5 No iniciado

## Alertas experiencia
`experience_support_requested`, `screen_error_recurrent` (+ reutiliza §§12–14).

## KPI
Consulta completa sin alertas → `0`; incompleta → `—`.
