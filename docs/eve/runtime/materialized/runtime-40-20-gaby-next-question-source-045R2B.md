# Runtime 40/20 Gaby Next Question Source 045R2B

The live UI still obtains questions from SceneQuestionnaireRunner using the legacy local manifest. Runtime render_next exists in the governed execution service, but it is not the live question source for Gaby.

No UI sequence change was made because answer persistence is blocked first by the unresolved atomicity gap.
