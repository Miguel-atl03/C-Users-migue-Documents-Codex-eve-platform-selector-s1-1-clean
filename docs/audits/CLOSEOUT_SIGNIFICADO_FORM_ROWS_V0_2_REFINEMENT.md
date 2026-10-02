# CLOSEOUT · Significado Form Rows V0.2 Refinement

## 1. Dictamen ejecutivo

**FORM_ROWS_V0_2_REFINEMENT_APPLIED**

La presentación de preguntas en Significado quedó refinada como formulario simple tipo hoja de trabajo: pregunta arriba, ayuda debajo, respuesta debajo. Las preguntas opcionales ahora muestran número `[N]` y badge discreto “Opcional” alineado a la derecha (en lugar del prefijo `[Opcional]`). Se redujo el peso visual de filas, campos y chips. No se alteró metodología, SelectionPolicy, WorkMap, page.tsx, APIs, Supabase, Runtime ni package files.

## 2. Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | `QuestionRow` con número en todas las preguntas; badge “Opcional” a la derecha; hint Q2; números 2/4/5 en opcionales |
| `src/components/significado/significado-de-tu-trabajo.module.css` | Filas más ligeras; `questionPromptMain`; badges alineados; campos y chips más compactos |
| `src/features/significado/significado-copy.ts` | `SIGNIFICADO_Q2_HINT` |
| `tests/regression/significado-de-trabajo-slice.test.ts` | Aserciones de badge opcional, hint Q2 y layout por fila |
| `tests/regression/significado-mba-alignment.test.ts` | Allowlist de este closeout |
| `docs/audits/CLOSEOUT_SIGNIFICADO_FORM_ROWS_V0_2_REFINEMENT.md` | Este documento |

**No tocados (confirmado):** `WorkMapIntake.tsx`, `page.tsx`, `src/app/api/**`, `src/services/runtime-engine/**`, Supabase, SQL, `middleware.ts`, `package.json`, `package-lock.json`.

## 3. Cambios visuales aplicados

### Patrón de fila (obligatoria)

```
[1] ¿Cómo llamarías a esta actividad...?                    Obligatoria
Usa el nombre que dirías en voz alta...
[ campo abierto ]
```

### Patrón de fila (opcional)

```
[2] Cuando dices '...', ¿qué pasa exactamente?              Opcional
Describe lo que haces, sin explicar causas o problemas.
[ textarea ]
```

### Patrón de opciones (frecuencia)

```
[3] ¿Con qué frecuencia aparece...?                         Obligatoria
Piensa en cómo ocurre normalmente...
(•) Diaria  ( ) Semanal  ( ) Quincenal  ( ) Mensual  ( ) Ocasional
```

### Refinamientos de densidad

- Bordes de `worksheet` y filas más suaves (menor opacidad, radio 6px).
- Padding de filas reducido (7px/9px).
- Campos abiertos más bajos (48px / 40px).
- Chips de frecuencia más compactos con acento verde al seleccionar.
- Badge “Obligatoria” / “Opcional” alineado a la derecha con `justify-content: space-between`.

### Mantenido sin cambio

- Sidebar, header, tarjeta de actividad, tarjeta introductoria.
- Franja de contexto y botones inferiores.
- Secciones A y B como separadores simples.
- Draft local, submit gate, `onBack`, `onContinue`.

## 4. Confirmaciones de layout

- [x] Layout tipo formulario: pregunta → ayuda → respuesta.
- [x] Opciones de frecuencia debajo de la pregunta 3 (chips horizontales con wrap).
- [x] Campos abiertos (input/textarea) debajo de cada pregunta.
- [x] Número `[N]` en obligatorias y opcionales.
- [x] Badge “Opcional” discreto a la derecha en preguntas 2, 4 y 5.
- [x] Sin textos técnicos prohibidos visibles al usuario.

## 5. Prueba manual `/dev/significado`

- **URL:** `http://localhost:3000/dev/significado`
- **Resultado esperado:** Hoja de trabajo ligera; cada pregunta lee verticalmente; chips de frecuencia bajo Q3; campos bajo Q1/Q2/Q4/Q5.

## 6. Tests

| Comando | Exit code | Resultado |
|---|---|---|
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | PASS (12/12) |
| `node --test tests/regression/significado-mba-alignment.test.ts` | 0 | PASS (4/4) |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 | PASS (7/7) |
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | 0 | PASS (10/10) |

## 7. git diff --name-only

Tracked diff preexistente (no editado en esta tarea):

```
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/lib/types.ts
```

Archivos de esta tarea (working tree):

```
src/components/significado/SignificadoDeTuTrabajo.tsx
src/components/significado/significado-de-tu-trabajo.module.css
src/features/significado/significado-copy.ts
tests/regression/significado-de-trabajo-slice.test.ts
tests/regression/significado-mba-alignment.test.ts
docs/audits/CLOSEOUT_SIGNIFICADO_FORM_ROWS_V0_2_REFINEMENT.md
```

Sin cambios en paths prohibidos por esta tarea.

## 8. Recomendación

**A. Revisión visual con Miguel en `/dev/significado`**

El patrón de fila ya cumple la especificación V0.2. El siguiente paso más útil es validación humana de densidad y legibilidad en desktop y móvil antes de escalar a más preguntas opcionales.

Alternativas:
- **B.** Extender la hoja con secciones C–D del Runtime usando el mismo `QuestionRow`.
- **C.** Pausar UI y avanzar persistencia real de respuestas Significado (fuera de alcance visual).
