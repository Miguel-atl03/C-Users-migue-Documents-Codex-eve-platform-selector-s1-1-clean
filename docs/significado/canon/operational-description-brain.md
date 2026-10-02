# Descripción operativa — cerebro LLM (ASRO v2)

Fuente canónica: `Descripción_Operativa_cerebro AI.docx`

Versión cableada en código: `src/features/significado/operational-description-canon.ts`

## Mapeo doc → producto

| Capa | Uso en EVE |
|------|------------|
| §2.1–2.4 ASRO | UI fija (5 chips) + campos del coach |
| §2 completo + §4 | System prompt del coach LLM y del ejemplo izquierdo |
| Script determinístico | Fallback del ejemplo izquierdo y del coach inline |
| Scan/heurísticas | Cierre pedagógico (5 campos) y trazabilidad |

## Regenerar texto desde docx

```bash
node scripts/extract-docx-text.mjs
```

Coloca el `.docx` en `docs/significado/canon/` antes de ejecutar.
