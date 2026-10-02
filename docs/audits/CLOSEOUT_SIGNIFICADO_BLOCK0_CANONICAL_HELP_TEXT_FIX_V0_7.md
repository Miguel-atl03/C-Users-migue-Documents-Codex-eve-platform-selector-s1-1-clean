# CLOSEOUT · Significado Block 0 Canonical Help Text Fix V0.7

## 1. Dictamen

**SIGNIFICADO_BLOCK0_CANONICAL_HELP_TEXT_FIX_V0_7_IMPLEMENTED**

V0.6 mostraba la columna `function` del XLSX como ayuda de usuario en B0-Q02, B0-Q03 y B0-Q04. V0.7 corrige esto: solo B0-Q01 tiene ayuda canónica extraída del Runtime Catalog; las demás declaran `CANONICAL_HELP_MISSING` y usan `fallback_no_canonico` documentado. La UI muestra ayudas útiles sin rediseñar la pantalla.

## 2. Archivos tocados (solo paths permitidos)

| Archivo | Cambio |
|---|---|
| `src/features/significado/runtime-block0-canonical.ts` | `helpTextKind`, `canonicalHelpStatus`, `technicalLabel`; ayudas canónicas vs fallback |
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | `data-help-kind`; agrupación de badges epistemológicos |
| `src/components/significado/significado-de-tu-trabajo.module.css` | `.epistemicBadgeGroup` para reducir ruido visual |
| `tests/regression/significado-de-trabajo-slice.test.ts` | Aserciones V0.7: canonical vs fallback, no `function` como ayuda |
| `tests/regression/significado-mba-alignment.test.ts` | `ALLOWED_DIFFS` + docs V0.7 |
| `docs/audits/AUDIT_RUNTIME_BLOCK0_CANONICAL_HELP_TEXT.md` | Auditoría de ayudas |
| `docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_HELP_TEXT_FIX_V0_7.md` | Este documento |

## 3. Fuente exacta de ayudas

| ID | Tipo | Texto UI | Fuente XLSX |
|---|---|---|---|
| B0-Q01 | **Canónico** | Revisa cada parte por separado: qué haces, sobre qué trabajas, cómo o bajo qué regla, qué queda listo. Si algo no encaja, usa «Corrección libre». | `UX_Subfield_Structure.display_rule` |
| B0-Q02 | **fallback_no_canonico** | Cuéntanos con tus palabras qué haces en esta actividad: qué parte del trabajo tocas y qué resultado concreto dejas al terminar. | `CANONICAL_HELP_MISSING` — `function` = «Descripción operativa mínima» (solo `technicalLabel`) |
| B0-Q03 | **fallback_no_canonico** | Completa cada subcampo por separado: con qué frecuencia ocurre, en qué situación suele darse y quién la ejecuta directamente. | `CANONICAL_HELP_MISSING` — `display_rule` es regla UI, no ayuda |
| B0-Q04 | **fallback_no_canonico** | Describe qué necesitas para empezar… / Confirma o ajusta dónde empieza… (suplementaria) | `CANONICAL_HELP_MISSING` — `function` = «Inicio y cierre de la actividad» (solo `technicalLabel`) |

## 4. Qué NO se tocó

- WorkMap
- `src/app/page.tsx`
- APIs, Supabase, Runtime engine
- `package.json`, `package-lock.json`
- SQL, middleware

## 5. Tests

| Comando | Exit code | Resultado |
|---|---:|---|
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | **0** | 16/16 pass |
| `node --test tests/regression/significado-mba-alignment.test.ts` | **0** | 4/4 pass |
| `node --test tests/regression/significado-flow-wiring.test.ts` | **0** | 7/7 pass |
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | **0** | 10/10 pass |

### Configuración git para tests con `git diff`

`eve-platform` no es raíz de repositorio. Los tests que invocan `git diff --name-only` requieren apuntar al repo padre:

```powershell
$repo = "...\Implementacion-significado-clean-clone"
$env:GIT_DIR = Join-Path $repo ".git"
$env:GIT_WORK_TREE = $repo
cd "$repo\external-consumers\eve-platform"
node --test tests/regression/significado-mba-alignment.test.ts
node --test tests/regression/significado-flow-wiring.test.ts
```

Alternativa: `git -c safe.directory="*"` desde el repo padre para `status`/`diff` manuales.

## 6. Verificación git

**Comando:** `git -c safe.directory="*" diff --name-only` (desde repo padre)

**Tracked diff actual (pre-existente, no modificado por V0.7):**

```text
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/lib/types.ts
```

**Archivos V0.7 (nuevos/modificados en slice, mayormente untracked en repo padre):**

```text
src/features/significado/runtime-block0-canonical.ts
src/components/significado/SignificadoDeTuTrabajo.tsx
src/components/significado/significado-de-tu-trabajo.module.css
tests/regression/significado-de-trabajo-slice.test.ts
tests/regression/significado-mba-alignment.test.ts
docs/audits/AUDIT_RUNTIME_BLOCK0_CANONICAL_HELP_TEXT.md
docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_HELP_TEXT_FIX_V0_7.md
```

## 7. Visual `/dev/significado`

La pantalla mantiene formulario simple con 4 preguntas, badges «Prellenado desde WorkMap» y «Requiere confirmación», y ayuda bajo cada pregunta. Los badges epistemológicos se agrupan para menor ruido visual.

## 8. Confirmación de alcance

- [x] Ayudas auditadas contra XLSX Runtime
- [x] `function` no usado como ayuda canónica
- [x] `CANONICAL_HELP_MISSING` declarado explícitamente
- [x] Fallbacks documentados como `fallback_no_canonico`
- [x] Sin rediseño de pantalla
- [x] Sin tocar paths prohibidos
