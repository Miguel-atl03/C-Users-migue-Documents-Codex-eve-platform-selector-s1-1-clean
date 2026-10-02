# CLOSEOUT · Significado Block 0 Canonical Questions V0.4

## 1. Dictamen

**BLOCK0_CANONICAL_QUESTIONS_V0_4_IMPLEMENTED**

La pantalla `/dev/significado` y el componente `SignificadoDeTuTrabajo` reemplazan las preguntas anteriores por las 9 preguntas canónicas del Bloque 0 en formato formulario simple. La actividad fixture de erogaciones contra Oracle queda prellenada. No se tocaron WorkMap, `page.tsx` principal, APIs, Supabase, Runtime, SelectionPolicy ni archivos de paquete.

## 2. Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/features/significado/significado-copy.ts` | Preguntas canónicas Bloque 0, secciones A/B/C, badge «Preguntas iniciales», opciones de frecuencia completas |
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | Layout formulario 9 preguntas; `SignificadoVisualDraft` alineado a Bloque 0 |
| `src/components/significado/significado-de-tu-trabajo.module.css` | Sin cambios estructurales (formato formulario ya existente) |
| `src/app/dev/significado/page.tsx` | Fixture dev con actividad Oracle y respuestas prellenadas canónicas |
| `tests/regression/significado-de-trabajo-slice.test.ts` | Aserciones actualizadas a copy canónico |
| `tests/regression/significado-mba-alignment.test.ts` | `ALLOWED_DIFFS` incluye este closeout |
| `docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_QUESTIONS_V0_4.md` | Este documento |

## 3. Actividad usada

**Título en tarjeta:**
Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes de desviaciones con análisis de causa raíz.

**Badge esperado:** Actividad 1 de 3 (workmap dev con 3 actividades elegibles por SelectionPolicy).

## 4. Preguntas canónicas visibles

| # | Pregunta | Tipo | Obligatoriedad |
|---|---|---|---|
| 1 | ¿Qué actividad vamos a revisar? | Abierta | Obligatoria |
| 2 | ¿Dónde empieza? | Abierta | Obligatoria |
| 3 | ¿Dónde termina? | Abierta | Obligatoria |
| 4 | ¿Qué objeto se transforma? | Abierta | Obligatoria |
| 5 | ¿Quién la ejecuta? | Abierta | Obligatoria |
| 6 | ¿Con qué frecuencia? | Opciones (Diaria, Semanal, Quincenal, Mensual, Eventual, Otro) | Obligatoria — default Mensual |
| 7 | ¿En qué contexto aparece? | Abierta | Opcional |
| 8 | ¿Qué variaciones tiene? | Abierta | Opcional |
| 9 | ¿Qué excepción típica aparece? | Abierta | Opcional |

### Secciones

- **A. Actividad y límites** — preguntas 1–3
- **B. Objeto, actor y frecuencia** — preguntas 4–6
- **C. Contexto, variación y excepción** — preguntas 7–9

## 5. Confirmación de formato formulario

- [x] Pregunta arriba con índice `[n]` y badge Obligatoria/Opcional a la derecha
- [x] Campo abierto inmediatamente debajo de cada pregunta abierta
- [x] Opciones de frecuencia inmediatamente debajo de la pregunta 6
- [x] Sin tarjetas grandes por pregunta (`worksheet` + `questionRow`)
- [x] Separación vertical reducida (estilos V0.2/V0.3 conservados)
- [x] Sin códigos internos visibles (R2.1, Bloque 0, runtime, payload, etc.)

## 6. Confirmación de limpieza visible

Eliminado del copy y del componente:

- «¿Cómo llamarías a esta actividad...?»
- «¿Qué pasa exactamente?»
- «Ubicar cuándo y dónde aparece»
- «Nombrar la actividad»
- Opciones de ejecutor predefinidas (ahora campo abierto)
- Opciones de variación predefinidas (ahora campos abiertos 8–9)
- Botón «Ver más preguntas opcionales»
- Pregunta 10 eliminada (ahora son 9 preguntas)

## 7. Tests

Comandos requeridos:

```bash
node --test tests/regression/significado-de-trabajo-slice.test.ts
node --test tests/regression/significado-mba-alignment.test.ts
node --test tests/regression/significado-flow-wiring.test.ts
node --test tests/regression/primary-activity-selection-policy.test.ts
```

| Comando | Exit code | Resultado |
|---|---|---|
| `significado-de-trabajo-slice.test.ts` | **0** | 12/12 pass |
| `significado-mba-alignment.test.ts` | **1*** | 3/4 pass — falla solo `forbidden files are not part of tracked product diff` porque `eve-platform` no es working tree git en este entorno |
| `significado-flow-wiring.test.ts` | **1*** | 6/7 pass — misma causa git |
| `primary-activity-selection-policy.test.ts` | **0** | 10/10 pass |

\* Las aserciones funcionales de copy, payload y wiring pasan. El fallo residual es ambiental (`git diff --name-only` → «Not a git repository»). En un clone git normal los cuatro comandos deben salir **0**.

## 8. git diff

Archivos esperados en diff (solo paths permitidos):

```
src/components/significado/SignificadoDeTuTrabajo.tsx
src/features/significado/significado-copy.ts
src/app/dev/significado/page.tsx
tests/regression/significado-de-trabajo-slice.test.ts
tests/regression/significado-mba-alignment.test.ts
docs/audits/CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_QUESTIONS_V0_4.md
```

**Paths prohibidos:** sin cambios en WorkMap, `page.tsx` principal, APIs, Supabase, Runtime, `package.json`, `package-lock.json`, middleware ni SQL.

## 9. Recomendación

**A. Aprobar V0.4 y abrir validación manual en `http://localhost:3000/dev/significado`**

El fixture dev cumple el brief de preguntas canónicas Bloque 0 en formato formulario. El siguiente paso natural es validación visual manual y, en iteración posterior, cablear respuestas visuales al motor Runtime cuando corresponda — fuera del alcance de esta tarea UI/dev fixture.

## 10. Confirmación de alcance

- [x] Solo UI/dev fixture
- [x] Sin Runtime completo
- [x] Sin cambios a SelectionPolicy
- [x] Sin tocar WorkMap
- [x] Sin tocar `src/app/page.tsx`
- [x] Sin tocar APIs / Supabase / Runtime engine / SQL / middleware / package files
