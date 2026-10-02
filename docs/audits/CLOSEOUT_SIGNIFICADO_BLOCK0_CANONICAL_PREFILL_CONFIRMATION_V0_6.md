# CLOSEOUT · Significado Block 0 Canonical Prefill Confirmation V0.6

## 1. Dictamen

**SIGNIFICADO_BLOCK0_CANONICAL_PREFILL_CONFIRMATION_V0_6_IMPLEMENTED**

Bloque 0 en `/dev/significado` funciona ahora como **confirmación asistida de baja carga**: WorkMap puede prellenar campos, pero la UI comunica explícitamente que lo prellenado **no es evidencia confirmada** hasta que el usuario continúa. La primera ficha ya no parece una respuesta capturada; muestra intención de revisión, badges epistemológicos discretos y aviso de confirmación antes del CTA.

## 2. Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/features/significado/significado-copy.ts` | Copy de intro, badges, aviso de confirmación y ayuda de límites |
| `src/features/significado/runtime-block0-canonical.ts` | Metadatos epistemológicos (`inferred_from_workmap`, `context_from_workmap`, `requires_confirmation`), badges y ayuda suplementaria B0-Q04 |
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | Badges visuales, estilos de prefill, ayuda suplementaria, aviso pre-CTA |
| `src/components/significado/significado-de-tu-trabajo.module.css` | Estilos `prefillBadge`, `confirmationBadge`, `prefilledInput`, `continueConfirmationNotice` |
| `src/app/dev/significado/page.tsx` | Fixture Oracle con anotaciones epistemológicas en comentarios |
| `tests/regression/significado-de-trabajo-slice.test.ts` | Aserciones V0.6: prefill, ayudas, subcampos, términos prohibidos |
| `tests/regression/significado-mba-alignment.test.ts` | `ALLOWED_DIFFS` + aserciones de prefill/confirmación |
| `docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_PREFILL_CONFIRMATION_V0_6.md` | Este documento |

## 3. Qué cambió desde V0.5

| Aspecto | V0.5 | V0.6 |
|---|---|---|
| Intención de la primera ficha | «Primero ubiquemos bien esta actividad» / «Preguntas iniciales» | «Esto es lo que EVE entendió desde tu mapa…» / «Requiere confirmación» |
| Estado epistemológico del prefill | Implícito (parecía respuesta ya capturada) | Explícito: `inferred_from_workmap` / `context_from_workmap` / `requires_confirmation` |
| Badges visuales | Solo Obligatoria/Opcional | + «Prellenado desde WorkMap», «Requiere confirmación» |
| Campos prellenados | Mismo estilo que respuesta confirmada | Fondo/ borde sutil verde (`prefilledInput`) |
| B0-Q03 actor/contexto | Prellenado sin distinción | Subcampos contextuales con «Sugerencia desde el contexto; corrige si no aplica.» |
| B0-Q04 inicio/cierre | Solo ayuda canónica breve | + ayuda suplementaria de confirmación de límites |
| Antes de continuar | Sin aviso | «Al continuar, esta información quedará confirmada para esta actividad.» |
| Runtime persistente | No implementado | Sigue sin implementarse (solo contrato visual) |

## 4. Cómo se distingue prefill de respuesta confirmada

| Estado interno (no visible al usuario) | Significado | Representación UI |
|---|---|---|
| `inferred_from_workmap` | WorkMap infirió el valor; no es `captured_user_evidence` | Badge «Prellenado desde WorkMap» + campo con estilo `prefilledInput` |
| `context_from_workmap` | Sugerencia contextual, no evidencia | Hint «Sugerencia desde el contexto; corrige si no aplica.» |
| `requires_confirmation` | El usuario debe confirmar o corregir antes de cerrar | Badge «Requiere confirmación» |
| Confirmación al continuar | Al pulsar CTA, el usuario acepta o corrige la descripción | Aviso `SIGNIFICADO_CONTINUE_CONFIRMATION_NOTICE` |

**Regla rectora respetada:** lo prellenado desde WorkMap **no cuenta como evidencia** hasta que el usuario continúa (confirmación explícita en UI, sin persistencia Runtime en este slice).

## 5. Fuente de ayuda por pregunta

| runtime_interaction_id | Pregunta visible | Ayuda mostrada | Hoja | Columna fuente |
|---|---|---|---|---|
| B0-Q01 | Esto es lo que entendimos de esta actividad. ¿Está correcto?… | qué haces, sobre qué trabajas, cómo o bajo qué regla, qué queda listo y corrección libre. | `UX_Subfield_Structure` | `display_rule` (cláusula tras «subcampos separados para») |
| B0-Q02 | En tus palabras, ¿qué ocurre cuando haces esta actividad? | Descripción operativa mínima | `Runtime_Interactions_Base_40` | `function` |
| B0-Q03 | ¿Con qué frecuencia aparece, en qué situación suele ocurrir y sobre quién recae directamente? | Frecuencia, contexto y actor inmediato | `Runtime_Interactions_Base_40` | `function` |
| B0-Q04 | ¿Qué recibes, ves o necesitas para empezar, y qué queda listo para darla por terminada? | Inicio y cierre de la actividad | `Runtime_Interactions_Base_40` | `function` |
| B0-Q04 (suplementaria) | (misma pregunta) | Confirma o ajusta dónde empieza y dónde termina realmente esta actividad. | — | **Fallback documentado V0.6** — requisito UX de confirmación de límites; no existe columna literal en XLSX |

### Nota B0-Q02

La ayuda canónica del XLSX es «Descripción operativa mínima» (`function`). No se inventó ayuda alternativa. Si en el futuro se requiere texto más explicativo del tipo «Describe qué haces, sobre qué trabajas…», habría que localizarlo en XLSX o documentar `CANONICAL_HELP_MISSING` con fallback aprobado.

## 6. Estado epistemológico esperado (fixture Oracle)

**Actividad:** Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes de desviaciones con análisis de causa raíz.

| Campo | Estado | Justificación |
|---|---|---|
| B0-Q01 subcampos (excepto corrección libre) | `inferred_from_workmap` | Derivados del texto literal de la actividad en WorkMap |
| B0-Q02 textarea | `inferred_from_workmap` | Resumen operativo prellenado desde actividad |
| B0-Q03.frequency_base = «Mensual» | `inferred_from_workmap` | Explícito en «proyección **mensual**» — no inferido sin fuente |
| B0-Q03.typical_context | `context_from_workmap` | Sugerencia contextual de cierre/control |
| B0-Q03.primary_actor_scope | `context_from_workmap` | Ejemplo contextual de rol; no evidencia confirmada |
| B0-Q04 inicio/cierre | `requires_confirmation` | Límites no derivados automáticamente como hechos cerrados |
| Variación / excepción (C01) | No renderizada | Sin fuente explícita en actividad; no inventada |

## 7. Tests

| Comando | Exit code | Resultado |
|---|---:|---|
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | **0** | 15/15 pass |
| `node --test tests/regression/significado-mba-alignment.test.ts` | **1*** | 3/4 pass — aserciones funcionales OK |
| `node --test tests/regression/significado-flow-wiring.test.ts` | **1*** | 6/7 pass — aserciones funcionales OK |
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | **0** | 10/10 pass |

\* Falla residual ambiental: `git diff --name-only` no disponible (`Not a git repository` en subcarpeta `eve-platform`). Las aserciones de copy, prefill, ayudas, subcampos y payload pasan.

### Nuevas aserciones V0.6

- Aparece «Prellenado desde WorkMap» / equivalente
- No aparece `captured_user_evidence` en UI
- Cada pregunta canónica tiene `helpText` visible
- B0-Q01 mantiene 5 subcampos compuestos
- No aparecen términos prohibidos (Respondido, Evidencia, Diagnóstico, etc.)

## 8. git diff

**Comando:** `git diff --name-only` / `git diff --stat`

**Resultado en este entorno:** no disponible — el directorio `eve-platform` no es raíz de repositorio git.

**Archivos esperados en diff (solo paths permitidos):**

```text
src/features/significado/significado-copy.ts
src/features/significado/runtime-block0-canonical.ts
src/components/significado/SignificadoDeTuTrabajo.tsx
src/components/significado/significado-de-tu-trabajo.module.css
src/app/dev/significado/page.tsx
tests/regression/significado-de-trabajo-slice.test.ts
tests/regression/significado-mba-alignment.test.ts
docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_PREFILL_CONFIRMATION_V0_6.md
```

**Paths prohibidos:** sin cambios en WorkMap, `src/app/page.tsx`, APIs, Supabase, Runtime engine, `package.json`, `package-lock.json`, middleware ni SQL.

## 9. Recomendación

**A. Aprobar V0.6 y validar visualmente en `http://localhost:3000/dev/significado`**

El contrato visual de confirmación asistida está listo. El siguiente paso natural (fuera de alcance) sería persistir en Runtime el cambio de estado epistemológico (`inferred_from_workmap` → `captured_user_evidence`) solo tras confirmación explícita del usuario, y activar C01 cuando el trigger canónico lo exija.

**B.** Iterar copy de ayuda B0-Q02 si consultoría requiere texto más orientador (requiere fuente XLSX o fallback formal).

**C.** Retener V0.5 si se prefiere no exponer badges epistemológicos hasta tener Runtime persistente.

## 10. Confirmación de alcance

- [x] UI/dev fixture + contrato visual de evidencia
- [x] WorkMap prellena pero no confirma (sin `captured_user_evidence` en UI)
- [x] Usuario debe confirmar o corregir (badges + aviso pre-CTA)
- [x] Sin Runtime completo persistente
- [x] Sin tocar WorkMap / `src/app/page.tsx` / APIs / Supabase / Runtime engine / package files
