# CLOSEOUT · Significado Visual Questions Row Layout V0.2

## 1. Dictamen ejecutivo

**QUESTIONS_ROW_LAYOUT_APPLIED**

La sección de preguntas de “Significado de tu trabajo” pasó de tarjetas pesadas por pregunta a filas compactas tipo hoja de trabajo. Las respuestas (campos abiertos y opciones tipo Estado A) quedan inmediatamente debajo de cada pregunta. No se alteró metodología, SelectionPolicy, contratos funcionales ni wiring de navegación.

## 2. Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/components/significado/SignificadoDeTuTrabajo.tsx` | Reemplazo de `QuestionCard` por `QuestionRow`; hojas de trabajo por sección; hints debajo de preguntas; respuestas en bloque `questionAnswer` |
| `src/components/significado/significado-de-tu-trabajo.module.css` | Estilos de fila compacta, separadores de sección, chips de frecuencia horizontales, campos más bajos |
| `src/features/significado/significado-copy.ts` | Hints de ayuda para Q1 y Q3 |
| `tests/regression/significado-de-trabajo-slice.test.ts` | Aserciones de layout por fila y hint de frecuencia |
| `tests/regression/significado-mba-alignment.test.ts` | Allowlist de closeout V0.2 |
| `docs/audits/CLOSEOUT_SIGNIFICADO_VISUAL_QUESTIONS_ROW_LAYOUT_V0_2.md` | Este documento |

**No tocados (confirmado):** `WorkMapIntake.tsx`, `page.tsx`, `client/**`, APIs, Supabase, Runtime, SQL, `middleware.ts`, `package.json`, `package-lock.json`.

## 3. Cambios visuales aplicados

### Antes
- Tarjeta blanca independiente por pregunta con borde redondeado amplio.
- Número en círculo grande separado del texto.
- Input/textarea con `margin-top: 12px` y altura generosa.
- Grid de frecuencia en columnas tipo dashboard.

### Después
- Hoja de trabajo (`worksheet`) por sección A y B con separador ligero.
- Cada pregunta es una fila (`questionRow`) con lectura vertical rápida.
- Preguntas obligatorias: prefijo `[N]` + badge discreto “Obligatoria”.
- Preguntas opcionales: prefijo `[Opcional]` sin saturar con badges.
- Ayuda breve (`questionHint`) debajo del enunciado cuando aplica.
- Campo de respuesta en `questionAnswer` con solo 6px de separación.
- Frecuencia en chips horizontales compactos con estado seleccionado en verde.
- Textareas compactas (56px / 44px) para descripción y contexto.

### Mantenido sin cambio
- Sidebar con pasos 1–5 y tarjeta lateral.
- Header, tarjeta de actividad actual, tarjeta introductoria.
- Franja de contexto verde.
- Botones “Volver al mapa” y continuar.
- `onBack`, `onContinue`, draft local y submit gate.

## 4. Confirmaciones de layout

- [x] Opciones de frecuencia debajo de la pregunta 3.
- [x] Inputs y textareas debajo de cada pregunta abierta.
- [x] Patrón tipo Estado A (radio-cards/chips) más compacto.
- [x] Sin selector de actividades, ranking, score, gates, payload ni IDs técnicos visibles.
- [x] Sin textos dev prohibidos (R2.1, Supabase, runtime, etc.).

## 5. Prueba manual `/dev/significado`

- **URL:** `http://localhost:3000/dev/significado`
- **Estado:** El dev server compiló los cambios (Fast Refresh) con textos esperados: secciones A/B, filas con `[1]`/`[3]`/`[Opcional]`, chips Diaria–Ocasional, botones inferiores.
- **Resultado esperado:** Hoja de trabajo guiada, no formulario de tarjetas pesadas.

## 6. Tests

| Comando | Exit code | Resultado |
|---|---|---|
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | PASS (12/12) |
| `node --test tests/regression/significado-mba-alignment.test.ts` | 0 | PASS (4/4) |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 | PASS (7/7) |
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | 0 | PASS (10/10) |

## 7. git diff --name-only

Tracked diff en repo padre (preexistente a esta tarea, no editado aquí):

```
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/lib/types.ts
```

Archivos de esta tarea (working tree / untracked en sandbox):

```
src/components/significado/SignificadoDeTuTrabajo.tsx
src/components/significado/significado-de-tu-trabajo.module.css
src/features/significado/significado-copy.ts
tests/regression/significado-de-trabajo-slice.test.ts
tests/regression/significado-mba-alignment.test.ts
docs/audits/CLOSEOUT_SIGNIFICADO_VISUAL_QUESTIONS_ROW_LAYOUT_V0_2.md
```

Sin cambios en paths prohibidos por esta tarea.

## 8. Recomendación

**B. Continuar con siguiente slice visual del Runtime (más preguntas / secciones C–D)**

El layout por fila ya está listo para escalar a las demás preguntas opcionales sin rehacer la estructura. El siguiente paso natural es extender la hoja con más filas del Runtime manteniendo este patrón, antes de congelar pantalla o cablear persistencia real de respuestas.

Alternativas:
- **A.** Revisión visual con Miguel en `/dev/significado` y ajustes finos de densidad/spacing.
- **C.** Pausar UI y avanzar persistencia de respuestas Significado (fuera de alcance de esta tarea visual).
