# EVE 00 Method Kernel - Controlled Wiring Design V1

## 1. Estado del chip

`METHOD_KERNEL_PACKAGE_CONSISTENT_NOT_WIRED`

El paquete `EVE_00_Method_Kernel_v0_2` esta consistente como candidato documental/machine-readable. D1 es fuente metodologica primaria; D4 y D5 son fronteras Runtime verificadas. El chip no esta cableado, no tiene `runtimeAuthority` y no debe ser importado por codigo productivo en esta fase.

## 2. Proposito del cableado futuro

El cableado futuro serviria para evaluar conformance y consistencia metodologica MMABP sobre candidatos estructurales PM, MoC, PF y OLC ya formados, sin tomar control del Runtime ni de la experiencia de usuario.

Su funcion seria responder: "Los candidatos estructurales disponibles cuentan una historia MMABP consistente y suficientemente sustentada por evidencia?"

No debe responder: "El rol tiene patologia EVE?", "la actividad esta lista para Produccion Paralela?", "que actividad primaria elegir?", ni "el usuario puede avanzar en UI?"

## 3. Que no debe hacer

- No diagnostica patologias EVE.
- No produce IR.
- No exporta registry.
- No ejecuta Produccion Paralela.
- No reemplaza Runtime catalog.
- No reemplaza WorkMap.
- No decide seleccion primaria.
- No reemplaza B0.
- No bloquea UI directa antes de evidencia suficiente.
- No actua como Runtime readiness/reentry gate.
- No usa D4/D5 como fuente metodologica MMABP.
- No convierte WorkMap draft, B0 prefill o texto libre en evidencia cerrada.

FND-007/FND-008 usan D4/D5 solo como frontera de compatibilidad, no como implementacion de gates Runtime.

## 4. Modos de cableado

### Shadow mode

Modo recomendado para primer cableado futuro.

- Corre internamente despues de que existan candidatos estructurales preliminares.
- No bloquea flujo de usuario.
- No modifica payloads.
- No aparece en UI.
- No escribe registry.
- No dispara diagnostico.
- Produce solo trazas y auditoria interna.

### Advisory mode

Modo posterior, condicionado a evidencia de estabilidad en shadow mode.

- Produce recomendaciones internas.
- Puede sugerir `ready_with_flags` o `manual_review_required` como decision metodologica, no como Runtime readiness.
- No bloquea flujo de usuario.
- No reemplaza Runtime readiness/reentry.
- No decide seleccion primaria.
- Puede abrir tareas internas de revision, no cambios automaticos en UI.

### Controlled gate mode

Modo futuro y no activable por defecto.

- Requiere autorizacion explicita de Miguel.
- Requiere evidencia estructurada con provenance.
- Requiere tests ampliados y fixtures de contradicciones.
- Solo podria operar antes de Produccion Paralela y despues de candidatos PM/MoC/PF/OLC.
- No puede bloquear B0, WorkMap, SelectionPolicy ni captura UI directa.
- No puede ser `runtimeAuthority` sin una tarea separada de autorizacion y registro.

## 5. Inputs seguros

Inputs permitidos:

- `structuralCandidateRecord`.
- `pmCandidate`.
- `mocCandidate`.
- `pfCandidate`.
- `olcCandidate`.
- `evidenceItems`.
- `canonicalVariableRecords`.
- `sourceRefs`.
- `provenance`.
- `conformanceResults` previos, si existen.
- `consistencyResults` previos, si existen.
- `runtimeBlock0ResponseBundle` solo como evidencia confirmada o corregida por usuario, no como prefill.

Inputs prohibidos como fuente primaria V1:

- Texto libre sin provenance.
- WorkMap draft crudo como evidencia cerrada.
- B0 prefill no confirmado.
- Outputs de UI sin response bundle.
- Datos sin `sourceRef`.
- Inferencias sin estado epistemico.

## 6. Outputs permitidos

- `methodKernelEvaluationResult`.
- `conformanceFindings`.
- `consistencyFindings`.
- `readinessMethodologicalDecision`.
- `manualReviewRequest`.
- `missingEvidenceFlags`.
- `contradictionFlags`.
- `sourceRefTrace`.
- `auditEvents`.

Los estados permitidos deben seguir el paquete:

- `ready`.
- `ready_with_flags`.
- `blocked_by_missing_evidence`.
- `blocked_by_contradiction`.
- `manual_review_required`.
- `reentry_required`.

Estos estados son metodologicos, no Runtime readiness final.

## 7. Outputs prohibidos

- Diagnostico EVE.
- IR.
- Registry.
- Payload de Produccion Paralela.
- Runtime gate final.
- Decision de actividades primarias.
- Mutacion de WorkMap.
- Mutacion de B0/B0.5.
- Mensajes visibles al usuario final en V1.
- `runtimeAuthority`.

## 8. Punto recomendado de integracion

El punto recomendado no es `src/config`, ni SelectionPolicy, ni WorkMap, ni B0.

Cuando se implemente, deberia vivir como un modulo puro bajo `src/domain` para tipos/reglas y `src/services` para ejecucion, por ejemplo:

- `src/domain/method-kernel-evaluation.ts`
- `src/services/method-kernel-evaluator.ts`

Pero eso es solo una ruta futura. En esta fase no se crea ni se importa nada.

Momento recomendado:

1. WorkMap redacta responsabilidades/actividades.
2. SelectionPolicy v1.3 selecciona actividades primarias.
3. Significado/B0 captura evidencia confirmada.
4. B0.5 y/o etapas posteriores generan candidatos PM/MoC/PF/OLC.
5. Method Kernel evalua candidatos estructurales.
6. Solo despues, una capa posterior decide si hay readiness de produccion.

El Method Kernel no debe bloquear B0 ni operar solo con B0.

## 9. Relacion con Runtime 40/20

Runtime 40/20 captura y organiza evidencia. Method Kernel evalua conformance y consistencia metodologica de candidatos estructurales.

Estados separados:

- Runtime readiness/reentry: decide si la captura Runtime tiene suficientes variables operativas.
- Methodological readiness: decide si PM/MoC/PF/OLC son metodologicamente conformes y consistentes.
- Diagnostic readiness: pertenece a etapas EVE posteriores, no a etapa 00.
- Production readiness: pertenece a Produccion Paralela/IR/registry, no al Method Kernel 00.

No deben fusionarse estos estados. `blocked_by_missing_canonical_route` sigue siendo frontera Runtime, no estado operativo del Method Kernel.

## 10. Relacion con B0/B0.5

B0 por si solo no contiene candidatos PM/MoC/PF/OLC suficientes. B0 puede aportar evidencia confirmada, pero no debe ser bloqueado por el Method Kernel.

B0.5 o una etapa intermedia puede preparar candidatos estructurales preliminares. El Method Kernel puede evaluar solo cuando existan:

- evidencia confirmada o corregida por usuario;
- source refs;
- provenance;
- candidatos PM/MoC/PF/OLC identificables;
- trazabilidad entre variables Runtime y candidatos estructurales.

## 11. Relacion con SelectionPolicy v1.3

SelectionPolicy v1.3 decide que actividades primarias entran al Runtime. El Method Kernel no participa en esa decision.

Frontera:

- SelectionPolicy usa senales arquitectonicas prospectivas bajo incertidumbre.
- Method Kernel evalua conformance/consistency cuando ya existen candidatos estructurales.
- Method Kernel no puede reordenar, reemplazar ni promover actividades.
- Cualquier hallazgo metodologico debe conservarse como auditoria o recomendacion, no como decision de seleccion.

## 12. Relacion con WorkMap Assistance

WorkMap Assistance ayuda a redactar responsabilidades y actividades; no produce evidencia Runtime confirmada.

El Method Kernel no debe consumir WorkMap draft crudo como evidencia cerrada. Puede recibir contexto WorkMap solo si esta marcado como `context_from_workmap` o `inferred_from_workmap`, nunca como `captured_user_evidence`.

## 13. Relacion con ASRO

ASRO en Significado ayuda a construir descripcion operativa y componentes ciberneticos de B0-Q02. El Method Kernel no reemplaza ASRO.

ASRO puede aportar evidencia estructurada si el response bundle conserva:

- componente cubierto;
- texto confirmado/corregido;
- provenance;
- estado epistemico;
- source runtime interaction id.

El Method Kernel no debe generar coaching ASRO, no debe mostrar mensajes de trinchera al usuario y no debe decidir cierre pedagogico de Significado.

## 14. Riesgos

Riesgos principales:

- Bloquear UI prematuramente.
- Duplicar Runtime readiness.
- Diagnosticar en etapa 00.
- Usar evidencia no confirmada.
- Convertir conformance en juicio organizacional.
- Invadir SelectionPolicy.
- Invadir WorkMap Assistance.
- Usar D4/D5 como fuente metodologica.
- Registrar `runtimeAuthority` demasiado pronto.
- Drift de estados entre Runtime y Method Kernel.

Mitigacion base: shadow mode, cero payload mutation, cero UI, trazas internas y pruebas ampliadas antes de cualquier avance.

## 15. Condiciones minimas antes de cablear

- Tests de paquete ampliados.
- Fixtures de candidatos PM/MoC/PF/OLC validos e invalidos.
- Fixtures de evidencia insuficiente y contradiccion.
- Contrato de input/output aprobado.
- Separacion explicita de readiness Runtime vs methodological readiness.
- Confirmacion de que no existe `runtimeAuthority`.
- Confirmacion de que el chip no importa `src` productivo desde docs.
- Decision explicita de Miguel para pasar de diseno a implementacion.

## 16. Tests requeridos antes de implementacion

- Parse y consistencia del paquete.
- Contrato de input minimo.
- Rechazo de texto libre sin provenance.
- Rechazo de WorkMap draft crudo como evidencia.
- Rechazo de B0 prefill no confirmado.
- Evaluacion positiva de PM/MoC/PF/OLC consistentes.
- Evaluacion de missing evidence.
- Evaluacion de contradiction flags.
- Garantia de que shadow mode no bloquea, no muta payload y no escribe registry.
- Garantia de que advisory mode no reemplaza Runtime readiness.
- Garantia de que controlled gate no puede activarse por defecto.
- Snapshot de fronteras: no diagnostico, no IR, no registry, no Produccion Paralela, no seleccion primaria.

## 17. Recomendacion

Recomendacion: mantener el paquete como candidate not wired y preparar tests ampliados antes de cualquier implementacion shadow.

NO_WIRING_YET

DESIGN_ONLY

