# AUDIT - EVE-05-GATE-ENGINE-INDEPENDENT-RECORD-RULE-SOURCE-QA-V1_3

Dictamen: `GATE_ENGINE_RECORD_RULE_QA_UNSATISFACTORY_RETURN_TO_WORKBENCH`

V2_1 fue usado solo como indice secundario. La aceptacion dependio de verificar sourcePath, sourceLocator, sourceExcerpt, target rule y proofFor contra fuentes originales.

## Resultados

- companion proofs checked: 157
- companion proofs accepted: 141
- companion proofs rejected: 16
- atomic rules checked: 130
- atomic rules accepted: 115
- atomic rules rejected: 15
- genericProofsAccepted: 0

## QA por modulo

- critical_route_gate: checked 14, accepted 14, rejected 0
- failure_guards: checked 14, accepted 13, rejected 1
- mmabp_conformance_gate: checked 61, accepted 53, rejected 8
- mmabp_consistency_gate: checked 38, accepted 33, rejected 5
- process_state_timer_gate: checked 15, accepted 14, rejected 1
- semantic_resolution_gate: checked 15, accepted 14, rejected 1

## Razones principales de rechazo

- pdf_page_locator_not_exact; excerpt found on physical page(s) [3, 5, 6, 8, 9] not declared page 123: 14
- docx_paragraph_excerpt_not_found: 7
- pdf_page_locator_not_exact; excerpt found on physical page(s) [3, 5, 6, 8, 9] not declared page 205: 4
- pdf_page_locator_not_exact; excerpt found on physical page(s) [3, 5, 6, 8, 9] not declared page 202: 4
- pdf_page_locator_not_exact; excerpt found on physical page(s) [3, 5, 6, 7, 8] not declared page 99: 2

## Nota independiente

Los rechazos no corrigen el paquete. Indican que V2_1 todavia no entrega prueba exacta verificable bajo criterio independiente para 31 validaciones, principalmente por locators PDF D1 con pagina impresa en vez de pagina fisica del PDF y algunos DOCX con parrafo/excerpt no localizable.
