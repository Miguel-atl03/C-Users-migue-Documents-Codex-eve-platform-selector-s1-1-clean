# Unidad 2A — Reporte de casos huérfanos

Fecha de ejecución: 2026-07-15.

Entorno verificado: Supabase local en Docker, proyecto `eve-platform`, después
de aplicar y reaplicar la migración Unidad 2A.

## Resultado real

- casos inspeccionados: 0;
- casos huérfanos: 0;
- casos cruzados entre empresas: 0;
- identificadores técnicos afectados: ninguno;
- empresa verificable pendiente: ninguna;
- relación verificable pendiente: ninguna.

Salida de `report-orphans`:

```json
{
  "ok": true,
  "report": "unlinked_cases",
  "count": 0,
  "cases": []
}
```

Salida del verificador final:

```json
{
  "status": "pass",
  "orphanCases": 0,
  "crossCompanyCases": 0,
  "invalidAssignments": 0,
  "missingPolicies": [],
  "missingConstraints": [],
  "relationshipsWithoutCompany": 0,
  "duplicateActiveAssignments": 0
}
```

## Causa y acción recomendada

No hay causas individuales que analizar porque el entorno local no contiene
casos de negocio. No se realizó ninguna asignación automática ni inferencia.

Antes de aplicar en staging o desarrollo remoto:

1. ejecutar el reporte en ese entorno;
2. revisar cada ID huérfano contra evidencia contractual verificable;
3. crear o identificar la relación explícita;
4. vincular con empresa y relación explícitas;
5. volver a ejecutar el verificador.

El proyecto remoto conectado informó 0 filas en `public.sesiones_llenado` al
momento de la inspección, pero Unidad 2A no se aplicó allí. Por tanto, este
documento acredita el entorno local validado y no declara un backfill remoto.
