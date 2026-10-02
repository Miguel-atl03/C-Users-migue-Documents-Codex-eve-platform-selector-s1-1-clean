# EVE04 Shadow QA Compare Test Reconcile

## Dictamen

SHADOW_QA_COMPARE_TEST_RECONCILED_WITH_REMAINING_GIT_BLOCKER

## Test actualizado

- `tests/regression/eve-04-runtime-catalog-shadow-qa-compare.test.ts`

## Cambio aplicado

Se elimino la expectativa obsoleta que aceptaba como diffs esperados:

- `src/app/admin/runtime-vsm/page.tsx`
- `src/app/page.tsx`

El test ahora valida que la lista de rutas productivas prohibidas en `git diff --name-only` sea exactamente `[]`.

Tambien se ajusto el test para poder ejecutarse desde la raiz Git:

- resuelve `appRoot` desde `import.meta.url`;
- consulta Git con `git -C <gitRoot>`;
- normaliza rutas `external-consumers/eve-platform/...`;
- pasa `repoRoot: appRoot` al servicio shadow.

## Resultado observado

`src/app/admin/runtime-vsm/page.tsx` ya no aparece en `git diff --name-only`.

El test reconciliado falla correctamente porque aun aparece:

- `src/app/page.tsx`

Esto es un blocker real de worktree para promocion, no una expectativa vieja del test.

## Comandos y exit codes

- `pwd`: exit 0
- `git status --short`: exit 0
- `git diff --name-only`: exit 0
- `node --test external-consumers/eve-platform/tests/regression/eve-04-runtime-catalog-shadow-service.test.ts`: exit 1
- `node --test external-consumers/eve-platform/tests/regression/eve-04-runtime-catalog-shadow-qa-compare.test.ts`: exit 1

## Tests

### shadow-service

Falla por:

- rutas relativas internas del test cuando se ejecuta desde raiz Git;
- `src/app/page.tsx` fuera de allowlist.

### shadow-qa-compare

Pasan 5/6 checks. Falla el check de rutas prohibidas porque detecta:

- `src/app/page.tsx`

## No contaminacion

- producto tocado: false
- src/app tocado: false
- chips tocados: false
- runtime tocado: false
- package tocado: false

## Recomendacion

HUMAN_CLEAN_WORKTREE_REQUIRED para resolver `src/app/page.tsx` antes de intentar promocion o QA verde completo.
