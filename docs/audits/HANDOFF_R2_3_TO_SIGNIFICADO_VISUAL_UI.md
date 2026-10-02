# HANDOFF R2.3 -> Significado Visual UI

## 1. Estado cerrado

R2.3 PrimaryActivitySelectionPolicy queda cerrado como:

`R2_3_SELECTION_POLICY_READY_WITH_DEVIATIONS`

## 2. Que ya existe

- Selector interno in-memory.
- `selectPrimaryActivitiesFromWorkMap`.
- `PrimaryActivitySelectionResult`.
- Integracion antes de Significado.
- `selectedPrimaryActivities` con maximo 8.
- `nonPrimaryContextActivities`.
- `userSelectedActivities: false`.
- `primaryActivitySelectionResolvedByUser: false`.
- `runtimeBudget` 40+20 por actividad primaria.

## 3. Regla congelada

```text
0 elegibles -> reentry_required
1-8 elegibles -> non_competitive_inclusion
>8 elegibles -> competitive_selection
```

## 4. Que NO debe hacer la UI

La UI de Significado no debe mostrar:

- selector;
- ranking;
- score;
- gates;
- candidatos tecnicos;
- IDs `act-*` o `wm-*`;
- payload;
- bundle;
- VSM;
- MMABP;
- AHE;
- runtime;
- diagnostico;
- transduccion;
- export;
- Produccion Paralela;
- prioridad;
- claridad;
- energia;
- carga.

## 5. Que SI debe mostrar la UI

La UI puede mostrar:

- titulo "Significado de tu trabajo";
- explicacion operacional;
- resumen de WorkMap;
- conteo de responsabilidades;
- conteo de actividades declaradas;
- conteo humano de actividades preparadas si existe `selectionResult`;
- conteo humano de actividades conservadas como contexto;
- aviso `savedWithWarnings` si aplica;
- CTA "Continuar a preguntas";
- accion "Volver al mapa";
- estado humano de `reentry_required`.

## 6. Desviaciones vivas

- `selectionResult` in-memory.
- R2.4 persistencia/backend pendiente.
- Refresh/restore puede perder seleccion.
- `tsc/lint` `ENV_BLOCKED`.
- No branch/commit.
- Thresholds semanticos pendientes de afinacion con evidencia real.

## 7. Proximo paso autorizado

`R2.3-SIGNIFICADO-VISUAL-UI-PASS`

Alcance:

Solo interfaz visual de Significado, sin tocar metodologia, WorkMap, API, Supabase, Runtime ni package files.

