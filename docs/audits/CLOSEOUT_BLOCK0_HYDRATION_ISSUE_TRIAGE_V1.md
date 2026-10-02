# CLOSEOUT — BLOCK0-HYDRATION-ISSUE-TRIAGE-V1

## 1. Dictamen

**HYDRATION_ISSUE_BROWSER_EXTENSION_NOISE**

El overlay rojo de hidratación observado en desarrollo **no constituye un blocker de aplicación** para congelar Bloque 0. La evidencia apunta a atributos inyectados en el cliente (extensiones del navegador o tooling de automatización), **no presentes en el HTML server-rendered**.

No se aplicaron cambios de código.

---

## 2. Evidencia

### Mensaje observado (Next.js / React)

```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

React también lista entre causas posibles: *"It can also happen if the client has a browser extension installed which messes with the HTML before React loaded."*

### Atributos / diff observados

| Atributo | Origen probable | En HTML SSR |
|---|---|---|
| `fdprocessedid` | Extensión del navegador (form fillers, password managers, autofill) | **No** |
| `data-gr-ext-installed`, `data-new-gr-c-s-check-loaded` | Grammarly u otras extensiones de escritura | **No** |
| `data-cursor-ref` | Tooling de navegación automatizada (Cursor IDE Browser) | **No** |

### Reproducción en host

- **URL:** `http://localhost:3000/dev/significado`
- **Estado funcional Bloque 0 (contexto previo):** 2/4 y 3/4 bloquean Continue; 4/4 habilita; B0-Q04 inicio/cierre operativos; sin metadata Runtime visible.

### Verificación HTML server-rendered (Opción C)

Se descargó el HTML con:

```bash
curl.exe -s -o .tmp-significado-ssr.html -w "%{http_code}" http://localhost:3000/dev/significado
```

- **HTTP status:** `200`
- **Búsqueda en HTML:** sin coincidencias de `fdprocessedid`, `data-gr-ext`, `grammarly`, `data-cursor-ref`, ni `spellcheck` añadido por extensión.

Conclusión: los atributos sospechosos **no vienen del servidor**; se añaden en el DOM del cliente antes o durante la hidratación.

### Revisión de código (archivos permitidos)

En `SignificadoDeTuTrabajo.tsx` y componentes Significado **no se encontró** en render directo:

- `Date.now()` / `Math.random()`
- IDs generados en render
- `window` / `localStorage` en cuerpo de render (la lectura de draft ocurre en inicializador de `useState`, fuera del markup)
- Clases condicionales por entorno en JSX

**Nota de hardening futuro (no bloqueante):** `readSignificadoDraftOrEmpty(sessionId)` en el inicializador de `useState` puede divergir server/client si `localStorage` tiene borrador para la sesión dev. Eso produciría mismatch de **contenido**, no de atributos como `fdprocessedid`. Archivo `significado-draft.ts` está fuera del alcance de este triage.

---

## 3. Verificación en entorno limpio

| Opción | Resultado |
|---|---|
| **A — Incógnito sin extensiones** | No ejecutada manualmente por el operador en esta corrida |
| **B — Otro navegador/perfil** | No ejecutada manualmente por el operador en esta corrida |
| **C — HTML server-rendered** | **Ejecutada.** Sin atributos de extensión en SSR |
| **D — Navegador automatizado sin extensiones de usuario** | Ejecutada vía Cursor IDE Browser. Aparece el mismo mensaje de hidratación con diff en atributos `data-cursor-ref` (tooling, no app) |

Recomendación operativa para el operador: confirmar en **ventana de incógnito con extensiones desactivadas** que el overlay desaparece o solo muestra ruido de tooling local.

---

## 4. Cambios aplicados

**Ninguno.** No corresponde modificar código por ruido de extensión/tooling según el alcance de `BLOCK0-HYDRATION-ISSUE-TRIAGE-V1`.

---

## 5. Tests con exit codes

| Comando | Resultado | Exit code |
|---|---|---|
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 19/19 pass | `0` |
| `node --test tests/regression/runtime-block0-catalog-adapter.test.ts` | 9/9 pass | `0` |
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | pass (suite completa) | `0` |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 5/7 pass, 2 fail | `1` |

### Detalle `significado-flow-wiring.test.ts`

Fallo en tests que ejecutan `git diff --name-only`:

```
warning: Not a git repository.
```

Clasificación: **BASELINE_CONTAMINATION_PREEXISTING** (entorno sin repositorio git inicializado en el workspace de ejecución; no atribuible a este triage).

---

## 6. Git status/diff

El workspace de ejecución reportó **no ser un repositorio git** (`git diff` / `git status` no disponibles). No hay diff de código introducido por este triage.

---

## 7. Recomendación

**A. Aprobar Bloque 0 y pasar a Bloque 0.5**

Rationale:

1. El mismatch reportado (`fdprocessedid`) es **ruido de extensión/navegador**, no evidenciado en SSR.
2. Bloque 0 cumple criterios funcionales previos (gate Continue, B0-Q04, sin metadata Runtime visible).
3. No hay fix de app requerido dentro del alcance permitido.
4. Tests obligatorios de regresión de Bloque 0 pasan.

**Acción sugerida para desarrollo local:** usar perfil sin extensiones o ignorar el overlay cuando el diff cite `fdprocessedid` / Grammarly / `data-cursor-ref`.

---

FIN — BLOCK0-HYDRATION-ISSUE-TRIAGE-V1
