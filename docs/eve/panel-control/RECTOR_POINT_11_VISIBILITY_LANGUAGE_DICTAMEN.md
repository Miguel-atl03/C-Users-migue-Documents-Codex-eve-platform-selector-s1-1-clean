# Dictamen — §11 visibilidad estructural + lenguaje operativo §§7–9

**Fecha:** 2026-07-16  
**Alcance:** UI/presentación únicamente. Sin cambios a persistencia, migraciones, BFF, autorización, ejes/matriz estructurales, staging/producción ni §12.

## Veredicto

1. **§11 permanece estructuralmente implementado** (resultado factual `effective` vía BFF/admin existentes).
2. **La capacidad es ahora visible** en Monitoreo aun cuando falten participante, perfil, sesión o resultado efectivo.
3. **Amber** tiene 0 participantes registrados; perfiles, sesiones y resultados de selección no son evaluables por falta de la precondición inicial. La UI muestra la estructura de cobertura con `—` / `No disponible` y mensaje causal, **sin inventar datos**.
4. **Lenguaje técnico de §§7–9** se traduce en capa de presentación a etiquetas operativas; fallback autorizado = `No disponible`.

## Cambios

### A. §11 siempre visible (caso activo)

- `CaseParticipantsPanel` deja de early-return sin cobertura: una sola sección con `ParticipantsContent` + `ActivitySelectionCoveragePanel`.
- `ActivityCoverageAvailability` + mensajes causales.
- Campos siempre renderizados; ausencia ≠ `0`.

### B. Lenguaje operativo

- Adaptador `operational-object-label-presentation.ts`.
- Etiquetas: Condición esperada del caso, Límite de espera, Resultado esperado.
- Prosa de chips (p. ej. EvidenceBundle embebido) sanitizada en UI sin alterar catálogos.

### C. Pruebas / capturas

- Regression: 9/9 pass (point-11 + visibility-language).
- Playwright: 2/2 pass.
- Capturas: `reports/local/rector-point-11-visibility-language/screenshots/01–09`.
- Fixtures locales solo-dev para estados 02–04 (no Amber factual).

## No iniciado

- §12 (Runtime).
