# MMABP Shared Input Gap Analysis

Fecha: 2026-07-23

## Resumen

El primer lote de normalizacion encontro campos explicitos suficientes para poblar tablas PM/PF/MoC/OLC, pero no suficientes para mover reglas a Lote B.

## Gaps Compartidos Principales

| inputId | reglas dependientes | modelo origen | ruta actual | campo estructurado | campo faltante | puede extraerse sin inferencia | reglas desbloqueables |
|---|---:|---|---|---|---|---:|---:|
| trigger_event_id | 4 | PM/PF | IR/registry gaps declaran ausencia | `trigger_event_id` | evento disparador explicito | no | 4 |
| produced_object_state_id | 5 | PF | no aparece como campo explicito | `produced_object_state_id` | estado producido por tarea | no | 5 |
| operation_id | 4 | MoC/OLC | gaps declaran operacion pendiente | `operation_id` | operacion explicita | no | 4 |
| constructor | 1 | OLC | no aparece como declaracion inequivoca | `constructor` | constructor explicito | no | 1 |
| destructor | 1 | OLC | no aparece como declaracion inequivoca | `destructor` | destructor explicito | no | 1 |
| timer_event_id | 1 | PF | fixture declara `timer_event: null` | `timer_event_id` | timer real | no | 1 |
| cardinality_source/target | 1 | MoC | no aparece cardinalidad estructurada | `cardinality_source`, `cardinality_target` | cardinalidad explicita | no | 1 |

## Decision

No se normalizaron campos por similitud de nombres, texto libre ni inferencia humana. Los faltantes permanecen como gaps factuales.

Dictamen: ESTRUCTURACION MMABP BLOQUEADA: LOS ARTEFACTOS ACTUALES NO CONTIENEN CAMPOS EXPLICITOS SUFICIENTES.
