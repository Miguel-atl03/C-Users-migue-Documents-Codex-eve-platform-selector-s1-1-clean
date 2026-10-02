# Errata metodologica 031-B / TR-015

No se crea un nuevo `trace_id`. Esta errata corrige el control metodologico existente `TR-015`.

| Campo | Valor |
| --- | --- |
| trace_id | TR-015 |
| previous_expectation | QA_Checklist T-001...T-020 with qa_id |
| corrected_expectation | 12 literal QA criteria from QA_Checklist, without qa_id |
| evidence.sheet | QA_Checklist |
| evidence.rows | 2-13 |
| evidence.columns | criterio; prueba; umbral_de_aceptacion; estado_esperado |
| reason | T-001...T-020 are not source fields in the authorized XLSX |

Los identificadores `T-001...T-020`, cuando aparecen en pruebas de codigo, quedan clasificados como `technical_test_identifiers`, no como IDs del catalogo rector. No existe crosswalk explicito demostrado, por lo que `explicit_crosswalk` queda como lista vacia.
