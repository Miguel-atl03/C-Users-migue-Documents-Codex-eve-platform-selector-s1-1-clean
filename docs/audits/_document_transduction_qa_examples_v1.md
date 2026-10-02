# Document Transduction QA Examples V1

## DOCX Mapping

```json
{
  "source": "EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
  "section": "Runtime completo",
  "target": "src/features/runtime/catalog/runtime-40-20.manifest.json",
  "coverageStatus": "transduced_structured",
  "sourceLocator": "section:Runtime completo",
  "targetLocator": "runtimeBudget + blocks + notYetMachineReadable"
}
```

## XLSX Mapping

```json
{
  "source": "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
  "sheet": "Runtime_Interactions_Base_40",
  "row": "B0-Q01",
  "target": "src/features/runtime/block0/block0.catalog.json",
  "coverageStatus": "transduced_structured",
  "sourceLocator": "sheet:Runtime_Interactions_Base_40 row:B0-Q01",
  "targetLocator": "interactions[0]"
}
```

## Approved Exclusion

```json
{
  "source": "nota editorial redundante",
  "coverageStatus": "intentionally_excluded_with_approval",
  "approvalReference": "docs/audits/CLOSEOUT_DOCUMENT_TRANSDUCTION_QA_CONTROL_V1.md"
}
```
