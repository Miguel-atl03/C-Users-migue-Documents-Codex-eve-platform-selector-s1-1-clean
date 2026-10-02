# Runtime 40/20 Gaby Minimal Binding 045R2B

Classification: $classification

The live Gaby questionnaire still posts legacy scene answers from SceneQuestionnaireRunner to /api/scenes/answers. The client payload still carries canonicalVariable from the legacy manifest and does not carry a server-issued Runtime binding for the active interaction instance.

No code was changed because the legacy scene write remains required and cannot yet be combined with Runtime ingest under one proven transaction.
