# Instrucciones Cursor — Integración política machine-readable v1.3

## Objetivo

Implementar `PRIMARY_ACTIVITY_SELECTION_V1_3` como política ejecutable canónica para selección de actividades primarias.

El XLSX queda como documento rector. La plataforma no debe leer XLSX en runtime. La fuente ejecutable debe ser JSON/TS.

## Archivos a agregar

Agregar uno de estos dos, según convenga al repo:

1. Opción TS recomendada:
   - `src/domain/primary-activity-selection-policy.v1.3.ts`
   - exporta `PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3`
   - exporta `PRIMARY_ACTIVITY_SELECTION_VERSION = "PRIMARY_ACTIVITY_SELECTION_V1_3"`

2. Opción JSON:
   - `src/rules/primary-activity-selection-policy.v1.3.json`
   - importar/validar desde `src/services/primary-activity-selector.ts`

No usar XLSX como runtime source.

## Archivos a modificar

- `src/domain/primary-activity-selection-policy.ts`
- `src/services/primary-activity-selector.ts`
- `tests/regression/primary-activity-selection-policy.test.ts`
- `src/features/dev/e2e-block0-demo-state.ts`
- si existe: cualquier mapper de trace dev que muestre `selectionReason`

## Cambios obligatorios

### 1. Cambiar versión

Reemplazar:
`PRIMARY_ACTIVITY_SELECTION_V1_2`

por:
`PRIMARY_ACTIVITY_SELECTION_V1_3`

en dominio, payload, trace y tests.

### 2. Selection mode

Implementar:

```ts
if (eligibleCount === 0) mode = "reentry_required";
else if (eligibleCount <= 8) mode = "non_competitive_inclusion";
else mode = "competitive_selection";
```

Si `eligibleCount <= 8`, incluir todas las elegibles después de gates. No aplicar ranking competitivo.

### 3. Competitive selection

En `competitive_selection`, calcular por actividad:

- `pmSignalPotential`
- `mocSignalPotential`
- `pfSignalPotential`
- `olcSignalPotential`
- `architecturalSignalPotential`
- `operationalCentrality`
- `transformationObjectSignal`
- `handoffDependencySignal`
- `timerWaitSignal`
- `synchronizationGovernanceSignal`
- `frictionExceptionSignal`
- `pfOlcRiskSignal`
- `coverageDiversityValue`
- `responsibilityBalanceAdjustment`
- `duplicatePenalty`
- `tooMacroPenalty`
- `tooMicroPenalty`
- `overlySpecificToolPenalty`
- `lateralContextPenalty`
- `finalSelectionScore`

### 4. Fórmula final

```ts
finalSelectionScore =
  0.30 * architecturalSignalPotential
+ 0.15 * operationalCentrality
+ 0.15 * transformationObjectSignal
+ 0.15 * handoffDependencySignal
+ 0.05 * timerWaitSignal
+ 0.10 * synchronizationGovernanceSignal
+ 0.10 * frictionExceptionSignal
+ 0.05 * pfOlcRiskSignal
+ 0.05 * coverageDiversityValue
+ responsibilityBalanceAdjustment
- duplicatePenalty
- tooMacroPenalty
- tooMicroPenalty
- overlySpecificToolPenalty
- lateralContextPenalty;
```

`responsibilityBalanceAdjustment` no puede exceder `0.05`.

### 5. Responsibility balance

No usar `responsibility_balance` como criterio primario.

Permitido:
- desempate;
- diversity correction;
- ajuste máximo +0.05.

Prohibido:
- desplazar una actividad con señal crítica alta;
- usar como razón principal de selección.

### 6. Special slot policy

Antes de completar por score plano, aplicar slots:

1. mayor señal arquitectónica total;
2. mayor transformación/objeto;
3. mayor handoff/dependencia/timer;
4. mayor sincronización/gobernanza transversal;
5. mayor riesgo PF/OLC;
6. mayor score final remanente;
7. cobertura de responsabilidad solo si no desplaza señales críticas;
8. exploratoria/ambigüedad útil o score remanente.

Deduplicar candidatos seleccionados entre slots.

### 7. Selection reason

Eliminar el string genérico como razón única:

```text
Selected by R2.3 structural score with responsibility balance.
```

Generar:

- `selectionReasonCode`
- `selectionReasonText`
- `selectedSlot`

Reason codes permitidos:

- `included_all_eligible_under_8`
- `selected_for_high_architectural_signal`
- `selected_for_transformation_object_signal`
- `selected_for_handoff_timer_signal`
- `selected_for_governance_synchronization_signal`
- `selected_for_pf_olc_risk_signal`
- `selected_for_friction_exception_signal`
- `selected_for_high_final_score`
- `selected_for_coverage_diversity_tiebreaker`
- `selected_for_exploratory_signal`

### 8. Contexto no primario

Conservar no seleccionadas con:

- `activityId`
- `responsibilityId`
- `activityTitle`
- `responsibilityTitle`
- `scores`
- `nonPrimaryContextStatus`
- `contextReason`
- `promotionCondition`

### 9. Trace dev

Mostrar por actividad:

- component scores;
- penalties;
- `finalSelectionScore`;
- `preferredSlotCandidate`;
- `selectedSlot`;
- `selectionReasonCode`;
- `selectionReasonText`;
- `responsibilityBalanceAffectedResult`.

La traza debe permitir auditar por qué entró o quedó fuera una actividad.

### 10. Caso de calibración Director de Costos

Agregar fixture con `director-costos-calibration.v1.3.json`.

En ese caso, la selección debe tender a:

- `R1-A3` Solicito códigos de Unidad de Negocio
- `R2-A1` Cuantifico materiales
- `R2-A4` Gestiono cotizaciones de proveedores
- `R2-A5` Elaboro cuadros comparativos
- `R2-A6` Integro matrices APU
- `R3-A1` Analizo proyección mensual de erogaciones
- `R3-A4` Valido estimaciones de obra
- `R3-A6` Protocolizo presupuesto

Primer reemplazo válido:
- `R3-A5` Elaboro órdenes de compra

No debe seleccionar antes que estas, salvo razón específica:
- Manual de Normas de Costeo
- Px para Site Development Proposal
- Presentar presupuesto final ante Dirección General
- Conciliación de activos fijos

## Entrega esperada

1. Archivos modificados.
2. Tests actualizados.
3. Nueva traza dev.
4. Confirmación de que Significado sigue recibiendo actividades primarias seleccionadas y ejecutando Runtime 40/20.
5. Confirmación de que `activity-ranker.ts` legacy no sobreescribe la selección primaria.