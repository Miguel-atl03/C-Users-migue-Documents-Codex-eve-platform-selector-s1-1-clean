# TREE CLEANUP PREP · Significado R2.2

## 1. Dictamen ejecutivo

Estado: REQUIRES_HUMAN_BACKUP.

El slice Significado R1/R2.1.1 esta materialmente listo y sus tests pasan.
La rama actual es `master` y el ultimo historial visible es front-door/session work.
El arbol contiene muchos cambios ajenos a Significado, tanto trackeados como untracked.
`page.tsx`, `types.ts`, APIs, WorkMap, runtime, SQL, docs de fases y `package.json` estan contaminados.
`package.json` y `package-lock.json` no parecen necesarios para Significado; los tests del slice corren directo con `node --test`.
No se recomienda commit selectivo en la rama actual salvo extrema disciplina de staging.
La estrategia recomendada es B: crear rama/worktree limpio desde baseline estable y aplicar solo paths Significado.
Antes de cualquier aislamiento debe hacerse respaldo humano del arbol sucio completo.

## 2. Evidencia de comandos

| Comando | Exit code | Resultado | Observacion |
|---|---:|---|---|
| `pwd` | 0 | `C:\Users\migue\Documents\Catalogo de preguntas y funcionalidad operativa - Implementacion\external-consumers\eve-platform` | Repo correcto; termina en `external-consumers\eve-platform`. |
| `git status --short` | 0 | Muchos `M` y muchos `??`. | Arbol sucio; incluye Significado, WorkMap, APIs, runtime, docs, SQL y packages. |
| `git branch --show-current` | 0 | `master` | La preparacion ocurre sobre `master`; no hacer commit directo sin aislar. |
| `git log --oneline -5` | 0 | `ebe4133`, `8fac829`, `d6b3bec`, `d0a916d`, `c982662`. | Ultimos commits son front-door/session/auth, no Significado aislado. |
| `git diff --name-only` | 0 | 21 archivos trackeados modificados. | No incluye untracked, donde vive gran parte de Significado y WorkMap. |
| `git ls-files --others --exclude-standard` | 0 | Lista extensa de archivos untracked. | Incluye slice Significado completo, WorkMap, runtime, docs, SQL y fixtures. |
| `git diff -- package.json` | 0 | Diff grande con muchos scripts de fases/runtime y `xlsx`. | No parece requerido por Significado R1/R2.1.1. |
| `git diff -- package-lock.json` | 0 | Agrega `xlsx` y dependencias transitivas (`adler-32`, `cfb`, `codepage`, etc.). | Debe excluirse del commit limpio de Significado. |
| `git diff -- src/app/page.tsx --stat` | 0 | Por orden de argumentos produjo diff completo; forma correcta `git diff --stat -- src/app/page.tsx` dio `797 insertions / 393 deletions`. | `page.tsx` contaminado, no pertenece al slice aislado. |
| `git diff -- src/lib/types.ts --stat` | 0 | Por orden de argumentos produjo diff; forma correcta `git diff --stat -- src/lib/types.ts` dio `6 insertions`. | `types.ts` modificado, no aislar con Significado R1/R2.1.1. |
| `git diff -- src/components/WorkMapIntake.tsx --stat` | 0 | Sin stdout. | El archivo esta untracked; Git no tiene diff contra baseline. |
| `dir src\domain` | 0 | Existe `significado-de-trabajo.ts`. | Contrato R1 presente. |
| `dir src\services` | 0 | Existen `significado-activity-anchor-adapter.ts` y `significado-draft.ts`. | Servicios Significado presentes. |
| `dir src\components\significado` | 0 | Existe `SignificadoDeTuTrabajo.tsx`. | Componente R2.1.1 presente. |
| `dir src\features\significado` | 0 | Existen `significado-copy.ts`, `significado-dev-fixture.ts`, `significado-draft-state.ts`. | Feature slice presente. |
| `dir tests\regression` | 0 | Existen tests Significado y tests WorkMap. | Tests de slice presentes. |
| `dir docs\audits` | 0 | Existen closeouts/gate Significado. | Docs de auditoria presentes. |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 | 10 tests, 10 pass. | Warning ESM por falta de `type: module`; no requiere package scripts. |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | 17 tests, 17 pass. | Slice R2.1.1 verde. |

## 3. Inventario del slice Significado

| Path | Categoria | Estado git | Necesario para R2.2 | Comentario |
|---|---|---|---|---|
| `src/domain/significado-de-trabajo.ts` | SIGNIFICADO_CORE | Untracked (`??`) | Si | Contratos R1, payload, locks false y tipos de readiness. |
| `src/services/significado-activity-anchor-adapter.ts` | SIGNIFICADO_CORE | Untracked (`??`) | Si | Adapter operacional y submit payload. |
| `tests/regression/significado-activity-anchor-adapter.test.ts` | SIGNIFICADO_CORE | Untracked (`??`) | Si | Test R1 del adapter; 10/10 pass. |
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | SIGNIFICADO_CORE | Untracked (`??`) | Si | Pantalla aislada R2.1.1. |
| `src/features/significado/significado-copy.ts` | SIGNIFICADO_CORE | Untracked (`??`) | Si | Copy visible y constantes. |
| `src/features/significado/significado-draft-state.ts` | SIGNIFICADO_CORE | Untracked (`??`) | Si | Estado local, readiness, submit builder. |
| `src/services/significado-draft.ts` | SIGNIFICADO_CORE | Untracked (`??`) | Si | Persistencia localStorage del slice. |
| `tests/regression/significado-de-trabajo-slice.test.ts` | SIGNIFICADO_CORE | Untracked (`??`) | Si | Test R2.1.1; 17/17 pass. |
| `src/features/significado/significado-dev-fixture.ts` | SIGNIFICADO_OPTIONAL_DEV | Untracked (`??`) | Opcional | Fixture de dev; util para QA local, no imprescindible para wiring productivo. |
| `src/app/dev/significado/page.tsx` | SIGNIFICADO_OPTIONAL_DEV | Untracked (`??`) | Opcional | Ruta dev aislada; puede incluirse en commit limpio si se preserva QA R2.1.1. |
| `docs/audits/CLOSEOUT_R1_SIGNIFICADO_MBA_CONTRACTS.md` | SIGNIFICADO_AUDIT_DOC | Untracked (`??`) | Recomendado | Evidencia R1. |
| `docs/audits/CLOSEOUT_R2_1_SIGNIFICADO_COMPONENT.md` | SIGNIFICADO_AUDIT_DOC | Untracked (`??`) | Recomendado | Evidencia R2.1.1. |
| `docs/audits/GATE_R2_2_SIGNIFICADO_FLOW_WIRING.md` | SIGNIFICADO_AUDIT_DOC | Untracked (`??`) | Recomendado | Gate R2.2 previo. |
| `docs/audits/AUDIT_R0_SIGNIFICADO_TRABAJO_MBA.md` | SIGNIFICADO_AUDIT_DOC | Untracked (`??`) | Opcional | Auditoria R0; util como contexto pero no mencionada como obligatoria para preservar. |

## 4. Inventario de contaminacion no Significado

| Path | Estado git | Riesgo | Recomendacion |
|---|---|---|---|
| `src/app/page.tsx` | Modified (`M`) | Alto: diff grande front-door/WorkMap/session; R2.2 toca este archivo despues. | Excluir del commit Significado R1/R2.1.1; aislar en baseline limpio antes de R2.2. |
| `src/lib/types.ts` | Modified (`M`) | Medio: cambio pequeno pero justo donde R2.2 agregara `intake_significado`. | Excluir del commit R1/R2.1.1; controlar en R2.2. |
| `src/components/WorkMapIntake.tsx` | Untracked (`??`) | Alto: archivo completo sin baseline Git, WorkMap H12 sensible. | No mezclar con Significado; requiere revision/commit propio. |
| `src/services/work-map-flatten.ts` | Untracked (`??`) | Alto: pipeline WorkMap y futura entrada a questionnaire. | No mezclar; proteger H12. |
| `src/services/work-map-operational-readiness.ts` | Untracked (`??`) | Alto: reglas de guardado/review. | No mezclar; requiere commit WorkMap propio. |
| `src/services/work-map-save-validation.ts` | Untracked (`??`) | Alto: validacion WorkMap. | No mezclar. |
| `src/services/work-map-activity-validation.ts` | Untracked (`??`) | Alto: asistencia y validacion. | No mezclar. |
| `src/services/work-map-responsibility-validation.ts` | Untracked (`??`) | Alto: asistencia y validacion. | No mezclar. |
| `src/app/api/intake/triple/route.ts` | Modified (`M`) | Alto: API de intake, fuera del scope. | Excluir; no crear phase Significado. |
| `src/app/api/session/bootstrap/route.ts` | Modified (`M`) | Alto: sesiones/auth. | Excluir. |
| `src/app/api/session/restore/route.ts` | Modified (`M`) | Alto: restore; Significado restore no autorizado. | Excluir. |
| `src/app/api/runtime/**` | Modified/untracked | Alto: runtime fuera de scope. | Excluir. |
| `src/services/runtime-engine/**` | Untracked (`??`) | Alto: runtime core. | Excluir. |
| `src/services/runtime-gates/**` | Untracked (`??`) | Alto: runtime gates. | Excluir. |
| `src/services/scene-repository.ts` | Modified (`M`) | Medio/alto: bootstrap scenes y questionnaire. | Excluir del slice R1/R2.1.1. |
| `src/components/SceneQuestionnaireRunner.tsx` | Modified (`M`) | Alto: questionnaire_main protegido. | Excluir. |
| `src/components/TripleIntake.tsx` | Modified (`M`) | Medio/alto: legacy intake. | Excluir. |
| `src/lib/session-boundary.ts` | Modified (`M`) | Medio/alto: session boundary. | Excluir. |
| `docs/phase*`, `fixtures/*`, `scripts/phase*`, `sql/migrations/*` | Untracked (`??`) | Alto volumen ajeno; fases/runtime/object inventory. | Excluir; owner/revision separada. |
| `middleware.ts` | Untracked (`??`) | Alto: auth/routing middleware. | Excluir. |
| `public/eve-logo.png`, `public/eve-paper-thread-visual.svg` | Untracked (`??`) | Medio: UI asset no Significado. | Excluir salvo PR visual separado. |

## 5. package.json y package-lock

Cambios que parecen Significado:

- Ninguno necesario para el slice R1/R2.1.1.
- Los tests requeridos corren con `node --test ...` sin scripts nuevos.
- No se requiere nueva dependencia para `SignificadoDeTuTrabajo`, draft local o adapter.

Cambios que no parecen Significado:

- Gran bloque de scripts `test:phase*`, `inspect:*`, `apply:*`, `verify:*`, `smoke:*`.
- Dependencia `xlsx`.
- `package-lock.json` agrega `xlsx` y dependencias transitivas como `adler-32`, `cfb`, `codepage`, `crc-32`, `frac`, `ssf`, `wmf`, `word`.

Decision:

- `package.json` debe excluirse del commit limpio de Significado.
- `package-lock.json` debe excluirse del commit limpio de Significado.
- Los tests Significado pueden ejecutarse sin scripts de package, usando comandos directos:
  - `node --test tests/regression/significado-activity-anchor-adapter.test.ts`
  - `node --test tests/regression/significado-de-trabajo-slice.test.ts`

## 6. Estrategia recomendada

Estrategia recomendada: B. Crear branch/worktree limpio desde baseline estable y aplicar solo archivos Significado como patch/copia controlada.

Justificacion:

- A no es ideal: commit selectivo en `master` con tantos `M` y `??` puede mezclar trabajo ajeno por error.
- B da mejor trazabilidad: partir de commit estable (`ebe4133` o el baseline que el humano confirme) y aplicar solo paths Significado.
- C no se recomienda: stash total en un arbol con trabajo ajeno no duenio claro es riesgoso, y puede ocultar archivos untracked si no se revisa con mucho cuidado.
- El slice Significado no necesita `package.json`, APIs, WorkMap, runtime ni SQL, por lo que se puede aislar en una rama limpia.

Estado final de preparacion: READY_TO_ISOLATE despues de respaldo humano. En el arbol actual, el dictamen operativo es REQUIRES_HUMAN_BACKUP.

## 7. Comandos humanos sugeridos

No ejecutados por esta tarea. Propuesta segura:

```powershell
git status --short
git branch --show-current
git log --oneline -5
```

Crear respaldo humano antes de mover piezas:

```powershell
git status --short > ..\eve-platform-pre-cleanup-status.txt
git diff -- src/app/page.tsx > ..\eve-platform-page-pre-cleanup.diff
git diff -- src/lib/types.ts > ..\eve-platform-types-pre-cleanup.diff
git diff -- package.json > ..\eve-platform-package-pre-cleanup.diff
git diff -- package-lock.json > ..\eve-platform-package-lock-pre-cleanup.diff
git ls-files --others --exclude-standard > ..\eve-platform-untracked-pre-cleanup.txt
```

Opcion B con worktree limpio:

```powershell
git worktree add ..\eve-platform-significado-clean -b codex/significado-r2-clean ebe4133
```

Copiar solo los paths Significado al worktree limpio usando una herramienta de copia revisada por humano. Luego, dentro del worktree limpio:

```powershell
git status --short
git add src/domain/significado-de-trabajo.ts
git add src/services/significado-activity-anchor-adapter.ts
git add tests/regression/significado-activity-anchor-adapter.test.ts
git add src/components/significado/SignificadoDeTuTrabajo.tsx
git add src/features/significado/significado-copy.ts
git add src/features/significado/significado-draft-state.ts
git add src/services/significado-draft.ts
git add tests/regression/significado-de-trabajo-slice.test.ts
git add docs/audits/CLOSEOUT_R1_SIGNIFICADO_MBA_CONTRACTS.md
git add docs/audits/CLOSEOUT_R2_1_SIGNIFICADO_COMPONENT.md
git add docs/audits/GATE_R2_2_SIGNIFICADO_FLOW_WIRING.md
git add docs/audits/TREE_CLEANUP_PREP_SIGNIFICADO_R2_2.md
```

Si se decide incluir QA dev aislado:

```powershell
git add src/features/significado/significado-dev-fixture.ts
git add src/app/dev/significado/page.tsx
```

Verificar staging antes de commit:

```powershell
git diff --cached --name-only
node --test tests/regression/significado-activity-anchor-adapter.test.ts
node --test tests/regression/significado-de-trabajo-slice.test.ts
git commit -m "Add Significado isolated slice"
```

## 8. Comandos prohibidos

- `git reset --hard`
- `git checkout .`
- `git clean -fd`
- `git stash` sin revisar
- `git stash --include-untracked` sin respaldo completo
- `Remove-Item -Recurse`
- comandos que borren directorios no trackeados
- `npm install`
- migraciones SQL
- scripts de runtime/apply
- cualquier comando que borre o sobrescriba trabajo ajeno

## 9. Condiciones antes de R2.2

- Slice Significado aislado en commit o rama limpia.
- Tests R1/R2.1.1 verdes:
  - `node --test tests/regression/significado-activity-anchor-adapter.test.ts`
  - `node --test tests/regression/significado-de-trabajo-slice.test.ts`
- `src/app/page.tsx` en baseline conocido o diff controlado.
- `src/lib/types.ts` en baseline conocido o diff controlado.
- `package.json` y `package-lock.json` fuera del PR de R2.2 salvo justificacion explicita.
- WorkMap H12 protegido: no tocar `WorkMapIntake.tsx`, `work-map-flatten.ts`, readiness ni validations en R2.2.
- APIs, Supabase, runtime, middleware y SQL fuera de scope.
- GATE R2.2 y TREE-CLEANUP-PREP disponibles como evidencia.

## 10. Matriz de archivos tocados por esta tarea

| Archivo | Accion |
|---|---|
| `docs/audits/TREE_CLEANUP_PREP_SIGNIFICADO_R2_2.md` | Creado por esta tarea audit-only. |

## 11. Guards confirmados

- [x] No se implemento R2.2.
- [x] No se conecto `flowState`.
- [x] No se toco `page.tsx`.
- [x] No se toco `types.ts`.
- [x] No se toco WorkMap.
- [x] No se tocaron APIs.
- [x] No se toco Supabase.
- [x] No se toco Runtime.
- [x] No se ejecuto reset.
- [x] No se ejecuto checkout global.
- [x] No se ejecuto stash.
- [x] No se hizo commit.
- [x] Solo se creo/actualizo el reporte.
