# 045-R3A-VR — Runtime FULL vs legacy isolation

Instruction: 045-R3A-V-R  
Gate: 2

## Structure

```
SceneQuestionnaireRunner (facade)
├── RuntimeFullQuestionnaireRunner   // Runtime FULL only
└── LegacySceneQuestionnaireRunner   // capa1 catalog path only
```

## Result

| Check | Value |
|---|---|
| `runtime_full_legacy_sequence_code_executed` | `false` |
| Runtime FULL imports `runtimeQuestionCatalog` | no |
| Runtime FULL computes `blockIndex` / `visibleQuestions` | no |
| Legacy path preserved for non-Runtime consumers | yes |

## Mechanism

Facade early-routes on `runtimeFull.enabled === true` to a separate React component tree. Legacy hooks (`catalog.blocks`, draft blockIndex, etc.) never mount in Runtime FULL mode.
